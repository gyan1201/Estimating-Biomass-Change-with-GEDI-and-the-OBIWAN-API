import React, { useState, useRef, useEffect } from 'react';
import './AIChat.css';

export default function AIChat({ aoi, annualData, stockData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm your EdgeMind Forest Assistant. Draw an AOI and ask me anything about the biomass data, trends, or carbon stock." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const generateAIResponse = (query) => {
    const q = query.toLowerCase();
    let response = "";

    if (!aoi || !annualData || annualData.length === 0) {
      return "Please select a region on the map first so I have data to analyze!";
    }

    const currentYear = annualData[annualData.length - 1].year;
    const currentAGBD = annualData[annualData.length - 1].AGBD.toFixed(2);
    const stock = stockData?.stock_mg ? (stockData.stock_mg / 1000).toFixed(2) : '--';
    
    // Simple intent matching
    if (q.includes('loss') || q.includes('drop') || q.includes('decrease') || q.includes('worst')) {
      let maxDrop = 0;
      let worstYear = null;
      for (let i = 1; i < annualData.length; i++) {
        const drop = annualData[i-1].AGBD - annualData[i].AGBD;
        if (drop > maxDrop) {
          maxDrop = drop;
          worstYear = annualData[i].year;
        }
      }
      if (maxDrop > 0) {
        response = `The most significant biomass loss occurred in **${worstYear}**, where the region lost **${maxDrop.toFixed(2)} Mg/ha** of AGBD compared to the previous year. This often indicates a harvesting event or natural disturbance.`;
      } else {
        response = "I couldn't find any significant biomass loss events in this region's history.";
      }
    } else if (q.includes('carbon') || q.includes('stock') || q.includes('total')) {
      response = `Currently, this region holds an estimated total biomass stock of **${stock} Giga-grams**. This equates to roughly **${(stock * 0.5).toFixed(2)} Gg of sequestered Carbon**!`;
    } else if (q.includes('compare') && q.match(/\d{4}/g)?.length >= 2) {
      const years = q.match(/\d{4}/g).map(Number);
      const data1 = annualData.find(d => d.year === years[0]);
      const data2 = annualData.find(d => d.year === years[1]);
      if (data1 && data2) {
        const diff = data2.AGBD - data1.AGBD;
        const trend = diff > 0 ? "increased" : "decreased";
        response = `Comparing ${years[0]} and ${years[1]}: Biomass went from ${data1.AGBD.toFixed(1)} to ${data2.AGBD.toFixed(1)} Mg/ha. That's a **${Math.abs(diff).toFixed(1)} Mg/ha ${trend}** over that period.`;
      } else {
        response = "I don't have data for both of those years. The available range is 1999–2023.";
      }
    } else if (q.includes('trend') || q.includes('overall') || q.includes('growth')) {
       const first = annualData[0].AGBD;
       const last = annualData[annualData.length - 1].AGBD;
       const pctChange = (((last - first) / first) * 100).toFixed(1);
       const direction = last > first ? 'grown' : 'declined';
       response = `Overall, the biomass density has **${direction} by ${Math.abs(pctChange)}%** since ${annualData[0].year}. The current density is ${currentAGBD} Mg/ha.`;
    } else {
      response = `I see you're asking about the data. Currently, the region has an AGBD of **${currentAGBD} Mg/ha** in ${currentYear}. Try asking me about specific years, biggest losses, or total carbon stock!`;
    }

    return response;
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Simulate network delay for AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <>
      <button className={`ai-chat-fab ${isOpen ? 'hidden' : ''}`} onClick={() => setIsOpen(true)}>
        <span className="fab-icon">🤖</span>
        <span className="fab-tooltip">Ask AI</span>
      </button>

      <div className={`ai-chat-window ${isOpen ? 'open' : ''} glass`}>
        <div className="chat-header">
          <div className="chat-title">
            <span className="chat-avatar">🤖</span>
            <div>
              <h4>EdgeMind Assistant</h4>
              <span className="chat-status">Online</span>
            </div>
          </div>
          <button className="chat-close" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        <div className="chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble-wrap ${msg.role}`}>
              <div className="chat-bubble">
                {/* Simple markdown bold parsing for **text** */}
                {msg.text.split('**').map((part, index) => 
                  index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-bubble-wrap ai">
              <div className="chat-bubble typing">
                <span className="dot"></span><span className="dot"></span><span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-footer" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Ask about biomass trends..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={!input.trim()}>↑</button>
        </form>
      </div>
    </>
  );
}
