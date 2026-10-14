"""Real macOS WebKit: HTTPS Glazy -> loopback images -> simulated M110."""
import argparse
import json
import os
import sys
import time
import objc
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--helper-dir', required=True)
parser.add_argument('--fixtures', required=True)
parser.add_argument('--runtime', required=True)
args = parser.parse_args()
sys.path.insert(0, str(Path(args.helper_dir).resolve()))
from mac_app import Server
from AppKit import NSApplication, NSWindow, NSBackingStoreBuffered, NSApplicationActivationPolicyRegular
from Foundation import NSObject, NSURL, NSURLRequest, NSTimer
from WebKit import WKWebView, WKWebViewConfiguration, WKWebsiteDataStore, WKContentRuleListStore

fixtures = Path(args.fixtures)
recipe = json.loads((fixtures/'label-printer-recipe.json').read_text())
html = (fixtures/'label-printer-source.html').read_text()
runtime = Path(args.runtime).read_text()
server = Server(simulate=True)
server.start()
if not server.ready.wait(10) or server.error:
    raise RuntimeError(server.error or 'Test server did not start')

script = '''(async()=>{
try{
if(location.origin!=='https://glazy.org'||!isSecureContext)throw Error('Test requires the real HTTPS Glazy origin');
const progress=stage=>window.webkit.messageHandlers.rbLabelTest.postMessage({stage});progress('HTTPS origin verified');
document.body.innerHTML=FIXTURE_HTML;
window.fetch=async()=>({ok:true,json:async()=>(FIXTURE_RECIPE)});
window.open=()=>{throw Error('A separate window must never be opened')};
Object.defineProperty(navigator,'bluetooth',{value:undefined});
eval(RUNTIME_CODE);
progress('Label tool opened');
const $=id=>document.querySelector('#rb-glazy-label-printer').shadowRoot.getElementById(id);
async function until(check,timeout=25000){const deadline=Date.now()+timeout;while(Date.now()<deadline){if(check())return;await new Promise(r=>setTimeout(r,100))}throw Error('Timeout: '+$('printerStatus').textContent+' / '+$('status').textContent)}
await until(()=>!$('connect').disabled);
progress('Recipe ready');
$('size').value='compact';$('size').dispatchEvent(new Event('change'));
$('height').value='20';$('height').dispatchEvent(new Event('input',{bubbles:true}));
await until(()=>!$('connect').disabled);
$('connect').click();
progress('Scanning in the panel');
await until(()=>[...$('macDevices').options].some(o=>o.value==='simulated-m110')&&!$('macDevices').disabled);
$('macDevices').value='simulated-m110';$('macDevices').dispatchEvent(new Event('change'));
$('macConnect').click();
progress('Connecting selected printer');
await until(()=>!$('print').disabled);
if(JSON.stringify([...$('transferMode').options].map(o=>o.value))!==JSON.stringify(['auto','steady']))throw Error('Unexpected speed choices');
if(JSON.stringify([...$('packetBytes').options].map(o=>o.value))!==JSON.stringify(['128','192','256']))throw Error('Unexpected packet choices');
for(const [mode,packet] of [['auto',128],['auto',192],['auto',256],['steady',128]]){
$('transferMode').value=mode;$('transferMode').dispatchEvent(new Event('change'));
$('packetBytes').value=String(packet);$('packetBytes').dispatchEvent(new Event('change'));
$('print').click();progress('Sending compact label '+mode+' '+packet);
await until(()=>!$('print').disabled,mode==='steady'?60000:25000);
const message=$('status').textContent;
if(!message.includes('all data acknowledged'))throw Error('Wrong delivery status: '+message);
if(!message.includes('Image send time:'))throw Error('Missing send timer');
}
if(!$('macPrinterPicker').hidden)throw Error('Printer picker stayed open after connection');
progress('Block Mac queue for stop test');
await new Promise(r=>setTimeout(r,100));
$('print').click();
progress('Stop check initial '+JSON.stringify({busy:window.RBGlazyLabelPrinter.isBusy,hidden:$('stopTransfer').hidden,disabled:$('stopTransfer').disabled,status:$('printerStatus').textContent}));
await until(()=>window.RBGlazyLabelPrinter.isBusy&&!$('stopTransfer').hidden&&!$('stopTransfer').disabled&&$('printerStatus').textContent.includes('Confirming setup'));
$('stopTransfer').click();
await until(()=>!window.RBGlazyLabelPrinter.isBusy);
if(!$('status').textContent.includes('Transfer stopped'))throw Error('Missing stopped status: '+$('status').textContent);
window.webkit.messageHandlers.rbLabelTest.postMessage({ok:true,message:$('status').textContent});
}catch(e){window.webkit.messageHandlers.rbLabelTest.postMessage({ok:false,message:e.message})}
})();'''.replace('FIXTURE_HTML',json.dumps(html)).replace('FIXTURE_RECIPE',json.dumps(recipe)).replace('RUNTIME_CODE',json.dumps(runtime))
script += '\nvoid 0;'

class Delegate(NSObject):
    @objc.python_method
    def report(self, result):
        print(('PASS: ' if result['ok'] else 'FAIL: ') + str(result['message']),flush=True)
        server.stop()
        # This is an isolated CI worker. Exit explicitly rather than letting
        # WebKit's process pool keep Cocoa's application loop alive.
        os._exit(0 if result['ok'] else 1)
    def webView_didFinishNavigation_(self, view, navigation):
        if getattr(self, 'started', False):
            return
        self.started = True
        def evaluated(result,error):
            if error:
                self.report(dict(ok=False,message=str(error)))
        view.evaluateJavaScript_completionHandler_(script,evaluated)
    def userContentController_didReceiveScriptMessage_(self, controller, message):
        result = dict(message.body())
        if 'stage' in result:
            print('WebKit: '+str(result['stage']),flush=True)
            if result['stage']=='Block Mac queue for stop test':
                async def blocked(*args, **kwargs):
                    await asyncio.Event().wait()
                server.printer.client.write_gatt_char=blocked
            return
        self.report(result)
    def timeout_(self, timer):
        self.report(dict(ok=False,message='WebKit test timed out'))

app = NSApplication.sharedApplication()
app.setActivationPolicy_(NSApplicationActivationPolicyRegular)
delegate = Delegate.alloc().init()
config = WKWebViewConfiguration.alloc().init()
config.setWebsiteDataStore_(WKWebsiteDataStore.nonPersistentDataStore())
config.userContentController().addScriptMessageHandler_name_(delegate,'rbLabelTest')
view = WKWebView.alloc().initWithFrame_configuration_(((0,0),(1400,1000)),config)
view.setNavigationDelegate_(delegate)
window = NSWindow.alloc().initWithContentRect_styleMask_backing_defer_(((0,0),(1400,1000)),1,NSBackingStoreBuffered,False)
window.setContentView_(view)
window.makeKeyAndOrderFront_(None)
# Keep Glazy's startup/hydration scripts from replacing our fixture panel.
# Content blocking isolates the test; no mixed-content or CORS setting changes.
rules = json.dumps([dict(trigger={'url-filter':'.*','resource-type':['script']},action={'type':'block'})])
def rules_ready(rule,error):
    if error:
        delegate.report(dict(ok=False,message=str(error)))
    config.userContentController().addContentRuleList_(rule)
    view.loadRequest_(NSURLRequest.requestWithURL_(NSURL.URLWithString_('https://glazy.org/recipes/482013')))
WKContentRuleListStore.defaultStore().compileContentRuleListForIdentifier_encodedContentRuleList_completionHandler_('RBLabelTestFixture',rules,rules_ready)
timer = NSTimer.scheduledTimerWithTimeInterval_target_selector_userInfo_repeats_(90,delegate,'timeout:',None,False)
app.run()
timer.invalidate()
server.stop()
result = getattr(delegate,'result',dict(ok=False,message='No test result'))
if not result['ok']:
    raise RuntimeError(result['message'])
print('PASS: real HTTPS Glazy origin in macOS WebKit, inline selection, PNG CORS replies and acknowledged compact label')
print(result['message'])

