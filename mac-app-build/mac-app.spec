from pathlib import Path
from PyInstaller.utils.hooks import copy_metadata

root = Path(SPECPATH)
name = 'Ronalds Mac Label Helper'
metadata = []
for package in ['bleak', 'aiohttp', 'pyobjc-framework-Cocoa', 'pyinstaller', 'certifi']:
    metadata += copy_metadata(package, recursive=True)
a = Analysis([str(root / 'mac_app.py')], pathex=[str(root)],
    datas=[(str(root / 'helper.html'), '.'), (str(root / 'PYTHON-LICENSE.txt'), 'licences')] + metadata,
    hiddenimports=['AppKit', 'CoreBluetooth', 'Foundation',
        'bleak.backends.corebluetooth.client', 'bleak.backends.corebluetooth.scanner'],
    hookspath=[], hooksconfig={}, runtime_hooks=[], excludes=[], noarchive=False)
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name=name,
    debug=False, bootloader_ignore_signals=False, strip=False, upx=False,
    console=False, argv_emulation=False, target_arch=None, codesign_identity=None,
    entitlements_file=None)
coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=False, name=name)
app = BUNDLE(coll, name=name+'.app', bundle_identifier='com.ronaldboersen.glazy-label-helper',
    info_plist={'CFBundleShortVersionString':'0.1.9', 'CFBundleVersion':'0.1.9',
        'NSBluetoothAlwaysUsageDescription':'Connect to your Phomemo M110 to print glaze labels from Glazy.',
        'NSBluetoothPeripheralUsageDescription':'Connect to your Phomemo M110 to print glaze labels.',
        'NSHighResolutionCapable':True})

