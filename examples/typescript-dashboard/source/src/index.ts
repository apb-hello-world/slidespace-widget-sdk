import { Host } from "@extism/as-pdk";

export function myAbort(
  _message: string | null,
  _fileName: string | null,
  _lineNumber: u32,
  _columnNumber: u32,
): void {}

function respond(mode: string): i32 {
  const input = Host.inputString();
  const inputLength = input.length.toString();
  Host.outputString(
    '{"state":{"lastMode":"' + mode + '"},' +
    '"values":{"headline":"Multi-source dashboard",' +
    '"statusSummary":"Host data received",' +
    '"metricSummary":"Input ' + inputLength + ' chars",' +
    '"history":"0.2,0.45,0.36,0.7,0.62"},"commands":[]}',
  );
  return 0;
}

export function initialize(): i32 { return respond("initialize"); }
export function handle_event(): i32 { return respond("event"); }
export function migrate_state(): i32 { return respond("migrate"); }
