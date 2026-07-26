const fs = require('fs');
const path = process.argv[2];
const s = fs.readFileSync(path, 'utf8');
const counts = { '{':0, '}':0, '(':0, ')':0, '[':0, ']':0 };
for (let i=0;i<s.length;i++){
  const ch = s[i];
  if (counts.hasOwnProperty(ch)) counts[ch]++;
}
console.log('counts', counts);

function findUnmatched() {
  const stack = [];
  const pairs = { '{':'}','(':')','[':']'};
  for (let i=0;i<s.length;i++){
    const ch = s[i];
    if (ch==='"' || ch==="'" || ch==='`'){
      // skip string literal
      const quote = ch;
      i++;
      while(i<s.length && s[i]!==quote){
        if (s[i]==='\\') i+=2; else i++;
      }
      continue;
    }
    if (ch==='/' && s[i+1]==='*'){
      i+=2;
      while(i<s.length && !(s[i]==='*' && s[i+1]==='/')) i++;
      i++;
      continue;
    }
    if (ch==='/' && s[i+1]==='/'){
      // skip line comment
      while(i<s.length && s[i]!=='\n') i++;
      continue;
    }
    if (pairs[ch]) {
      stack.push({ch, i});
    } else if (['}',')',']'].includes(ch)){
      const last = stack.pop();
      if (!last) return {pos:i,ch,reason:'closing-without-opening'};
      if (pairs[last.ch] !== ch) return {pos:i,ch,reason:'mismatch',expected:pairs[last.ch],found:ch};
    }
  }
  if (stack.length>0) return {pos:stack[0].i,ch:stack[0].ch,reason:'unclosed',expected:pairs[stack[0].ch]};
  return null;
}

console.log(findUnmatched());
