"""Observe pinned Bleak's unused native ready callback without replacing its logic."""
import asyncio
import weakref

_delegate_class = None


def delegate_class():
    global _delegate_class
    if _delegate_class is None:
        from bleak.backends.corebluetooth.PeripheralDelegate import ObjcPeripheralDelegate
        from bleak.backends._utils import external_thread_callback

        class RonaldM110QueueDelegate(ObjcPeripheralDelegate):
            @external_thread_callback
            def peripheralIsReadyToSendWriteWithoutResponse_(self, peripheral):
                self.rb_ready_callback()

        _delegate_class = RonaldM110QueueDelegate
    return _delegate_class


def attach(backend, callback):
    py_delegate = backend._delegate
    previous = py_delegate.objc_delegate
    observer = delegate_class().alloc().initWithPyDelegate_(weakref.ref(py_delegate))
    observer.rb_ready_callback = callback
    try:
        backend._peripheral.setDelegate_(observer)
    except Exception:
        backend._peripheral.setDelegate_(previous)
        raise
    py_delegate.objc_delegate = observer
    # Retain both the active observer and original delegate for this connection.
    return observer, previous


async def native_smoke_test():
    class PythonDelegate:
        pass
    py_delegate = PythonDelegate()
    seen = asyncio.Event()
    loop = asyncio.get_running_loop()
    observer = delegate_class().alloc().initWithPyDelegate_(weakref.ref(py_delegate))
    observer.rb_ready_callback = lambda: loop.call_soon_threadsafe(seen.set)
    assert observer.py_delegate() is py_delegate
    assert observer.respondsToSelector_('peripheralIsReadyToSendWriteWithoutResponse:')
    assert observer.respondsToSelector_('peripheral:didWriteValueForCharacteristic:error:')
    observer.peripheralIsReadyToSendWriteWithoutResponse_(None)
    await asyncio.wait_for(seen.wait(), 1)
