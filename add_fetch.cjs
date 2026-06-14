const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const fetchImplementation = `
      if (logToApi && apiUrl) {
        let headersObj = {};
        try {
          if (apiHeaders) headersObj = JSON.parse(apiHeaders);
        } catch(e) { console.error('Failed to parse custom api headers JSON'); }
        
        fetch(apiUrl, {
          method: apiMethod || 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${apiToken}\`,
            ...headersObj
          },
          body: JSON.stringify(payload)
        }).catch(err => console.error('Failed to post to API', err));
      }
`;

app = app.replace(
/        if \(logToApi && apiUrl && apiToken\) \{\n           console\.log\(`\[POST\/PUT to \$\{apiUrl\}\] Terminating log \$\{l\.id\} with token \$\{apiToken\.substring\(0,4\)\}\.\.\.`\);\n           \/\/ Wysłanie zapytania by wylogowano zamkniecie\n        \} else \{\n           console\.log\(`\[FILE APPEND logs\.txt\] Terminating \$\{l\.id\}`\);\n        \}/g,
`        const payload = { event: 'TERMINATE', log: { ...l, endTime: new Date().toISOString() } };
        if (logToApi && apiUrl) {
          let headersObj = {};
          try {
            if (apiHeaders) headersObj = JSON.parse(apiHeaders);
          } catch(e) { console.error('Failed parse headers json'); }
          
          fetch(apiUrl, {
            method: apiMethod || 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${apiToken}\`,
              ...headersObj
            },
            body: JSON.stringify(payload)
          }).catch(err => console.error('Failed API:', err));
        } else {
           console.log(\`[FILE APPEND logs.txt] Terminating \${l.id}\`);
        }`
);

app = app.replace(
/    if \(logToApi && apiUrl && apiToken\) \{\n      console\.log\(`\[POST\/PUT to \$\{apiUrl\}\] Starting log \$\{newLog\.id\} with token \$\{apiToken\.substring\(0,4\)\}\.\.\.`\);\n    \} else \{\n      console\.log\(`\[FILE APPEND logs\.txt\] Starting \$\{newLog\.id\}`\);\n    \}/g,
`    const payloadStart = { event: 'START', log: newLog };
    if (logToApi && apiUrl) {
      let headersObj = {};
      try {
        if (apiHeaders) headersObj = JSON.parse(apiHeaders);
      } catch(e) { }
      fetch(apiUrl, {
        method: apiMethod || 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${apiToken}\`, ...headersObj },
        body: JSON.stringify(payloadStart)
      }).catch(err => console.error('API Error:', err));
    } else {
      console.log(\`[FILE APPEND logs.txt] Starting \${newLog.id}\`);
    }`
);

app = app.replace(
/          if \(logToApi && apiUrl && apiToken\) \{\n            console\.log\(`\[POST\/PUT to \$\{apiUrl\}\] Terminating log \$\{l\.id\} with token \$\{apiToken\.substring\(0,4\)\}\.\.\.`\);\n          \} else \{\n            console\.log\(`\[FILE APPEND logs\.txt\] Terminating \$\{l\.id\}`\);\n          \}/g,
`          const payloadStop = { event: 'TERMINATE', log: { ...l, endTime: new Date().toISOString() } };
          if (logToApi && apiUrl) {
            let headersObj = {};
            try { if (apiHeaders) headersObj = JSON.parse(apiHeaders); } catch(e) {}
            fetch(apiUrl, {
              method: apiMethod || 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${apiToken}\`, ...headersObj },
              body: JSON.stringify(payloadStop)
            }).catch(err => console.error('API Error:', err));
          } else {
            console.log(\`[FILE APPEND logs.txt] Terminating \${l.id}\`);
          }`
);


fs.writeFileSync('src/App.tsx', app);
