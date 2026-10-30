import http.server
import json
import os
from datetime import datetime

PORT = int(os.environ.get("PORT", 5000))
REPORT_FILE = os.path.join(os.getcwd(), "test-report.json")

class ReportReceiverHandler(http.server.BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        self._set_headers(200)
        resp = {
            "status": "active",
            "message": "Python Report Receiver is listening",
            "reportPath": REPORT_FILE
        }
        self.wfile.write(json.dumps(resp).encode("utf-8"))

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8")

        try:
            report_data = json.loads(body)
            with open(REPORT_FILE, "w", encoding="utf-8") as f:
                json.dump(report_data, f, indent=2)

            print("\n=============================================================")
            print("  [RECEIVER] >>> NEW TEST REPORT RECEIVED & SAVED <<<")
            print(f"  File: {REPORT_FILE}")
            print(f"  Timestamp:   {report_data.get('executionTimestamp', datetime.now().isoformat())}")
            print(f"  Repository:  {report_data.get('repository')}")
            print(f"  Branch:      {report_data.get('branch')}")
            print(f"  Commit SHA:  {report_data.get('commitSha')}")
            print(f"  Run ID:      {report_data.get('pipelineRunId')}")
            print(f"  Overall:     {report_data.get('overallStatus')}")
            summary = report_data.get("summary", {})
            print(f"  Tests:       Total: {summary.get('total')} | Passed: {summary.get('passed')} | Failed: {summary.get('failed')}")
            print("-------------------------------------------------------------")
            for i, t in enumerate(report_data.get("tests", [])):
                mark = "PASS" if t.get("result") == "passed" else "FAIL"
                print(f"  [{mark}] {i + 1}. {t.get('name')}")
            print("=============================================================\n")

            self._set_headers(200)
            self.wfile.write(json.dumps({
                "success": True,
                "message": "Report saved successfully",
                "savedPath": REPORT_FILE
            }).encode("utf-8"))
        except Exception as e:
            print(f"  [RECEIVER ERROR]: {e}")
            self._set_headers(400)
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))

if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", PORT), ReportReceiverHandler)
    print("=============================================================")
    print(f"  PYTHON LOCAL TEST REPORT RECEIVER ACTIVE")
    print(f"  Port: http://localhost:{PORT}")
    print(f"  Target Output: {REPORT_FILE}")
    print("=============================================================")
    server.serve_forever()
