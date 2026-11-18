"""Verified downloads and transactional replacement of the idle Mac app."""
import hashlib
import json
import os
import platform
import plistlib
import posixpath
import shutil
import stat
import ssl
import certifi
import subprocess
import tempfile
import time
import urllib.request
import zipfile
from pathlib import Path

BASE = 'https://ronaldboersen.github.io/glazy-tools-dist/'
MANIFEST = BASE + 'mac-label-helper-update.json'
APP_NAME = 'Ronalds Mac Label Helper.app'
BUNDLE_ID = 'com.ronaldboersen.glazy-label-helper'
MAX_DOWNLOAD = 60 * 1024 * 1024
MAX_EXPANDED = 300 * 1024 * 1024


def version_tuple(value):
    parts = str(value).split('.')
    if len(parts) != 3 or any(not p.isdigit() for p in parts):
        raise ValueError('Invalid update version.')
    return tuple(int(p) for p in parts)


def fetch(url):
    if not url.startswith(BASE) or '?' in url or '#' in url:
        raise ValueError('Update URL is outside the download host.')
    response = urllib.request.urlopen(urllib.request.Request(url, headers={'Cache-Control':'no-cache'}), timeout=20, context=ssl.create_default_context(cafile=certifi.where()))
    if not response.geturl().startswith(BASE):
        response.close()
        raise ValueError('Update download redirected outside the download host.')
    return response


def check(current, machine=None):
    arch = {'arm64':'Apple-silicon','aarch64':'Apple-silicon','x86_64':'Intel'}.get(machine or platform.machine())
    if not arch:
        raise ValueError('Unsupported Mac architecture.')
    with fetch(MANIFEST) as response:
        raw = response.read(65537)
    if len(raw) > 65536:
        raise ValueError('Update information is too large.')
    manifest = json.loads(raw)
    latest = manifest['version']
    if version_tuple(latest) <= version_tuple(current):
        return None
    entry = manifest['downloads'][arch]
    if not isinstance(entry, dict) or not entry.get('url', '').startswith(BASE):
        raise ValueError('Invalid update download.')
    digest = entry.get('sha256', '')
    if len(digest) != 64 or any(c not in '0123456789abcdef' for c in digest):
        raise ValueError('Invalid update checksum.')
    if type(entry.get('bytes')) is not int or not 1 <= entry['bytes'] <= MAX_DOWNLOAD:
        raise ValueError('Invalid update download size.')
    return dict(version=latest, architecture=arch, **entry)


def bundle_info(app):
    if app.name != APP_NAME or not app.is_dir():
        raise ValueError('Not Ronald’s Mac Label Helper app.')
    info = plistlib.loads((app / 'Contents/Info.plist').read_bytes())
    if info.get('CFBundleIdentifier') != BUNDLE_ID:
        raise ValueError('The app has a different identity.')
    version_tuple(info.get('CFBundleShortVersionString'))
    return info


def unpack(archive, destination):
    """Extract only this app, preserving modes and contained relative symlinks."""
    app = destination / APP_NAME
    links = []
    with zipfile.ZipFile(archive) as zipped:
        if sum(i.file_size for i in zipped.infolist()) > MAX_EXPANDED:
            raise ValueError('Expanded update is too large.')
        for item in zipped.infolist():
            parts = item.filename.split('/')
            if '\\' in item.filename or item.filename.startswith('/') or '..' in parts:
                raise ValueError('Unsafe path in update archive.')
            if '__MACOSX' in parts or APP_NAME not in parts:
                continue
            parts = parts[parts.index(APP_NAME):]
            target = destination.joinpath(*parts)
            mode = item.external_attr >> 16
            if stat.S_ISLNK(mode):
                link = zipped.read(item).decode('utf8')
                normal = posixpath.normpath(posixpath.join('/'.join(parts[:-1]), link))
                if link.startswith('/') or '\\' in link or not (normal == APP_NAME or normal.startswith(APP_NAME + '/')):
                    raise ValueError('Unsafe symbolic link in update archive.')
                links.append((target, link))
            elif item.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open('wb') as output:
                    shutil.copyfileobj(zipped.open(item), output)
                target.chmod(mode & 0o777 or 0o644)
        for target, link in links:
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists() or target.is_symlink():
                raise ValueError('Conflicting symbolic link in update archive.')
            target.symlink_to(link)
    bundle_info(app)
    return app


def prepare(entry):
    folder = Path(tempfile.mkdtemp(prefix='ronald-helper-update-'))
    try:
        archive = folder / 'update.zip'
        digest, size = hashlib.sha256(), 0
        with fetch(entry['url']) as response, archive.open('wb') as output:
            while chunk := response.read(65536):
                size += len(chunk)
                if size > entry['bytes'] or size > MAX_DOWNLOAD:
                    raise ValueError('Update exceeds its expected size.')
                digest.update(chunk)
                output.write(chunk)
        if size != entry['bytes'] or digest.hexdigest() != entry['sha256']:
            raise ValueError('Update checksum or size did not match. Current app kept.')
        app = unpack(archive, folder / 'expanded')
        if bundle_info(app)['CFBundleShortVersionString'] != entry['version']:
            raise ValueError('Downloaded app version did not match.')
        subprocess.run(['/usr/bin/codesign','--verify','--deep','--strict',str(app)], check=True, capture_output=True)
        return app
    except BaseException:
        shutil.rmtree(folder, ignore_errors=True)
        raise


def installed_bundle(executable):
    for parent in Path(executable).resolve().parents:
        if parent.name == APP_NAME:
            bundle_info(parent)
            return parent
    raise ValueError('Install the app in Applications before using its updater.')


def replace(target, staged, launch=None):
    """Stage alongside the current app; roll back if replacement or launch fails."""
    target, staged = Path(target), Path(staged)
    old, new = bundle_info(target), bundle_info(staged)
    if version_tuple(new['CFBundleShortVersionString']) <= version_tuple(old['CFBundleShortVersionString']):
        raise ValueError('The downloaded app is not newer.')
    if not os.access(target.parent, os.W_OK):
        raise PermissionError('Applications is not writable. Install this update manually.')
    transaction = Path(tempfile.mkdtemp(prefix='.ronald-helper-update-', dir=target.parent))
    incoming, backup = transaction / APP_NAME, transaction / 'previous.app'
    moved = False
    try:
        shutil.copytree(staged, incoming, symlinks=True)
        # Preserve Gatekeeper quarantine metadata; never remove security attributes.
        if hasattr(os, 'listxattr') and 'com.apple.quarantine' in os.listxattr(target):
            os.setxattr(incoming, 'com.apple.quarantine', os.getxattr(target, 'com.apple.quarantine'))
        target.rename(backup)
        moved = True
        incoming.rename(target)
        (launch or (lambda p: subprocess.run(['/usr/bin/open','-n',str(p)], check=True)))(target)
    except BaseException:
        if moved:
            if target.exists():
                shutil.rmtree(target)
            backup.rename(target)
        raise
    finally:
        shutil.rmtree(transaction, ignore_errors=True)


def apply(plan_path):
    """Run from the downloaded app after the old process has shut down."""
    plan = json.loads(Path(plan_path).read_text())
    target, staged = Path(plan['target']), Path(plan['staged'])
    if installed_bundle(os.path.realpath(__import__('sys').executable)) != staged.resolve():
        raise ValueError('Update worker does not match the staged app.')
    deadline = time.monotonic() + 30
    while True:
        try:
            os.kill(plan['pid'], 0)
        except ProcessLookupError:
            break
        if time.monotonic() >= deadline:
            raise RuntimeError('The current helper did not close. Its app was kept.')
        time.sleep(.1)
    replace(target, staged)
    shutil.rmtree(staged.parents[1], ignore_errors=True)
