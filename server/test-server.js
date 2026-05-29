import http from "http";

const req = http.request(
  "http://localhost:4000/api/health",
  { method: "GET" },
  (res) => {
    let data = "";
    res.on("data", (chunk) => data += chunk);
    res.on("end", () => {
      console.log("Health:", res.statusCode, data);
    });
  }
);
req.end();

const req2 = http.request(
  "http://localhost:4000/api/employer/job-posts",
  { method: "GET" },
  (res) => {
    let data = "";
    res.on("data", (chunk) => data += chunk);
    res.on("end", () => {
      console.log("Job Posts:", res.statusCode, data);
    });
  }
);
req2.end();
