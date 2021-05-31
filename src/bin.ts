#!/usr/bin/env node

import("./index.js")
  .then((mod) => mod.default())
  .catch((err) => {
    console.error(String(err));
    process.exitCode = 1;
  });
