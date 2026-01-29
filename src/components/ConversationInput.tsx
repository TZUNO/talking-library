import { useRef, useEffect, useState } from 'react';
import { Send, Loader2, Mic } from 'lucide-react';

interface ConversationInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  /** 首次鍵盤輸入時呼叫（用於 thoughtTime） */
  onFirstKeystroke?: () => void;
  /** 首次有字元時呼叫（用於 inputDuration） */
  onFirstChar?: () => void;
  /** 按鈕點擊時呼叫，傳入按鈕 id（用於 clickPath） */
  onButtonClick?: (buttonId: string) => void;
}

export function ConversationInput({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  onFirstKeystroke,
  onFirstChar,
  onButtonClick,
}: ConversationInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);

  // 自動調整 textarea 高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onFirstKeystroke?.();
    // Cmd/Ctrl + Enter 送出
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    if (v.length > 0) onFirstChar?.();
    onChange(v);
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // 模擬語音輸入
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        console.log('語音輸入功能 (需要瀏覽器支援 Web Speech API)');
      }, 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative group">
        {/* 輸入框容器 */}
        <div className="relative rounded-2xl border border-border bg-card transition-all duration-300 focus-within:border-emerald-500 focus-within:shadow-xl focus-within:shadow-emerald-500/20">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="輸入材質需求或點擊上方範本，例如：'需要耐高溫、耐腐蝕的航空級鋁合金'"
            className="w-full min-h-[120px] max-h-[200px] p-6 pr-28 bg-transparent text-foreground placeholder:text-muted-foreground/60 resize-none outline-none rounded-2xl"
            rows={4}
          />

          {/* 按鈕組 */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            {/* 語音輸入按鈕 */}
            <button
              onClick={() => {
                onButtonClick?.('voice');
                handleVoiceInput();
              }}
              disabled={isSubmitting}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-muted text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-500'
              }`}
              aria-label="語音輸入"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* 送出按鈕 */}
            <button
              onClick={() => {
                onButtonClick?.('submit');
                onSubmit();
              }}
              disabled={!value.trim() || isSubmitting}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95"
              aria-label={isSubmitting ? '搜尋中' : '開始檢索'}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* 送出中的文字提示 */}
          {isSubmitting && (
            <div className="absolute bottom-20 right-4 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs">
              搜尋中...
            </div>
          )}
        </div>

        {/* 提示文字 */}
        <div className="mt-3 px-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>支援自然語言查詢</span>
          <span className="hidden sm:inline">
            按 <kbd className="px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">⌘</kbd> + 
            <kbd className="ml-1 px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">Enter</kbd> 開始檢索
          </span>
        </div>
      </div>

      {/* 範例提示 */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => {
            onButtonClick?.('example-1');
            onChange('找一種輕量、高強度、耐腐蝕的材料用於無人機機身');
          }}
          className="p-4 rounded-xl border border-border bg-card/50 text-sm text-muted-foreground text-left hover:border-emerald-500/30 hover:text-foreground hover:bg-card transition-all duration-200 group"
        >
          <div className="flex items-start gap-3">
            <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">🚁</span>
            <span className="flex-1">找一種輕量、高強度、耐腐蝕的材料用於無人機機身</span>
          </div>
        </button>
        <button
          onClick={() => {
            onButtonClick?.('example-2');
            onChange('需要透明、耐刮、抗UV的材質用於戶外顯示器保護罩');
          }}
          className="p-4 rounded-xl border border-border bg-card/50 text-sm text-muted-foreground text-left hover:border-emerald-500/30 hover:text-foreground hover:bg-card transition-all duration-200 group"
        >
          <div className="flex items-start gap-3">
            <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">📱</span>
            <span className="flex-1">需要透明、耐刮、抗UV的材質用於戶外顯示器保護罩</span>
          </div>
        </button>
      </div>
    </div>
  );
}
