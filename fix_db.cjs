const fs = require('fs');
let t = fs.readFileSync('src/components/DbExplorer.tsx', 'utf8');

// The erroneous ones are like: 
//                               </>
//        </CollapsibleCard>
//                        </td>
// Let's replace those with `)}\n                          </div>`

t = t.replace(/<\/>\n\s*<\/CollapsibleCard>\n\s*<\/td>/g, "</>\n                            )}\n                          </div>\n                        </td>");

// Also:
//                                 </div>
//                               )
//        </CollapsibleCard>
//                          </td>
t = t.replace(/<\/div>\n\s*\)\n\s*<\/CollapsibleCard>\n\s*<\/td>/g, "</div>\n                              ))}\n                            </div>\n                          </td>");

fs.writeFileSync('src/components/DbExplorer.tsx', t);
console.log('fixed broken parts');
