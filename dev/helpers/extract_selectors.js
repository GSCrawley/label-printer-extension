/*
 * Dev Helper: Extract probable selector targets from a ProShop Work Order page.
 * Usage (TEMP – do not ship in production build):
 * 1. Open the Work Order page (live OR the saved HTML via local server)
 * 2. Open DevTools Console
 * 3. Paste this entire file OR run: fetch(chrome.runtime.getURL('dev/helpers/extract_selectors.js')).then(r=>r.text()).then(eval)
 * 4. Call window.extractSelectors({ guessFields: true })
 * 5. Copy the JSON output and refine manually into content/selectors/*.json
 */
(function(){
  if (window.extractSelectors) return; // idempotent

  const LABEL_HINTS = [
    'Work Order', 'WO', 'Customer', 'Part', 'Rev', 'Quantity', 'Qty', 'Due Date', 'Customer PO', 'Cust. PO', 'Part Description'
  ];

  function norm(t){return (t||'').replace(/\s+/g,' ').trim();}

  function getPath(el){
    if (!el || !el.tagName) return '';
    const parts=[];
    while(el && el.nodeType===1 && parts.length<5){
      let sel=el.tagName.toLowerCase();
      if(el.id){ sel+='#'+CSS.escape(el.id); parts.unshift(sel); break; }
      if(el.classList.length){
        const c=[...el.classList].slice(0,2).map(x=>CSS.escape(x)).join('.');
        if(c) sel+='.'+c;
      }
      const sibs=[...el.parentNode?.children||[]].filter(n=>n.tagName===el.tagName);
      if(sibs.length>1){ sel+=`:nth-of-type(${sibs.indexOf(el)+1})`; }
      parts.unshift(sel);
      el=el.parentElement;
    }
    return parts.join(' > ');
  }

  function candidateValueNodes(){
    const nodes=[...document.querySelectorAll('td, span, div, a')]
      .filter(n=>n.childElementCount===0 && norm(n.textContent).length && norm(n.textContent).length<80);
    return nodes.slice(0,3000); // cap
  }

  function scoreNode(node){
    const txt=norm(node.textContent);
    let score=0;
    if(/^[0-9]{2}-[0-9]{4}$/.test(txt)) score+=5; // WO pattern
    if(/rev|^r\d+/i.test(txt)) score+=2;
    if(/qty|quantity/i.test(txt)) score+=2;
    if(/[A-Z]{3,}[0-9-]{2,}/.test(txt)) score+=1; // maybe part number
    if(node.id) score+=2;
    if(node.classList.length) score+=1;
    return {node, score, txt};
  }

  function nearestLabel(node){
    // look at previous siblings / parent preceding cells
    let label=null;
    let cur=node;
    for(let i=0;i<3 && cur;i++){
      const prev=cur.previousElementSibling;
      if(prev){
        const t=norm(prev.textContent);
        if(t && t.length<40 && /[:#]/.test(t)) { label=t; break; }
        if(LABEL_HINTS.some(h=>t.toLowerCase().includes(h.toLowerCase()))) { label=t; break; }
      }
      cur=cur.parentElement;
    }
    return label;
  }

  function buildGuess(nodes){
    const fieldMap={};
    nodes.filter(n=>n.score>=3).slice(0,50).forEach(({node, txt})=>{
      const label=nearestLabel(node);
      const path=getPath(node);
      const keyGuess=(label||'value').toLowerCase()
        .replace(/[^a-z0-9]+/g,'_')
        .replace(/_+/g,'_')
        .replace(/^_|_$/g,'');
      if(!fieldMap[keyGuess]) fieldMap[keyGuess]={ selectors: [], sample: txt, fromLabel: label||null };
      fieldMap[keyGuess].selectors.push(path);
    });
    return fieldMap;
  }

  async function extractSelectors(opts={}){
    const nodes=candidateValueNodes().map(scoreNode).sort((a,b)=>b.score-a.score);
    const guess=opts.guessFields?buildGuess(nodes):{};

    const result={
      generatedAt:new Date().toISOString(),
      location: location.href,
      topSamples: nodes.slice(0,30).map(n=>({text:n.txt, score:n.score, path:getPath(n.node)})),
      guessFields: guess
    };
    if(opts.log!==false){
      console.log('=== Selector Extraction Result ===');
      console.log(result);
      console.log('JSON Copy:\n', JSON.stringify(result,null,2));
    }
    return result;
  }

  window.extractSelectors=extractSelectors;
  console.info('[extract_selectors] Helper loaded. Run: extractSelectors({guessFields:true})');
})();
