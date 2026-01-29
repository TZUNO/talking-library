import { useState, useCallback, useEffect } from 'react';
import { TemplateCard } from './components/TemplateCard';
import { ConversationInput } from './components/ConversationInput';
import { HistoryPanel } from './components/HistoryPanel';
import { useExperimentTracking } from './hooks/useExperimentTracking';
import { logExperimentData, type InterfaceType } from './lib/experimentLog';
import { chatMaterialQuery } from './lib/gemini';

/** 從 URL 取得 userId（例如 ?userId=P001） */
function getUserIdFromSearch(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('userId') ?? '';
}

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  /** 介面類型：Template = 引導式（有範本卡片）, Free-form = 自由式（僅輸入框） */
  const [interfaceType, setInterfaceType] = useState<InterfaceType>('Template');
  /** 受測者編號，優先從 URL ?userId= 讀取 */
  const [userId, setUserId] = useState(() => getUserIdFromSearch());
  /** 最近一則 AI 回覆，可擴充為對話歷史 */
  const [lastReply, setLastReply] = useState<string | null>(null);

  const tracking = useExperimentTracking();

  // 若 URL 有 userId 則同步到 state
  useEffect(() => {
    const fromUrl = getUserIdFromSearch();
    if (fromUrl) setUserId(fromUrl);
  }, []);

  const handleTemplateClick = useCallback(
    (prompt: string, templateId: string) => {
      tracking.recordClick(templateId);
      setInputValue(prompt);
      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        (textarea as HTMLTextAreaElement)?.focus();
      }, 100);
    },
    [tracking]
  );

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isSubmitting) return;

    const thoughtTime = tracking.getThoughtTimeSeconds();
    const inputDuration = tracking.getInputDurationSeconds();
    const clickPath = tracking.getClickPath();
    const payload = {
      userId: userId || 'anonymous',
      interfaceType,
      inputText: inputValue.trim(),
      thoughtTime,
      inputDuration,
      clickPath,
      timestamp: new Date().toISOString(),
    };

    // 先記錄實驗資料到 GAS（不阻塞 UI）
    logExperimentData(payload).catch(() => {});

    setIsSubmitting(true);
    setLastReply(null);

    try {
      const reply = await chatMaterialQuery(inputValue.trim());
      setLastReply(reply);
    } catch (err) {
      console.error(err);
      setLastReply('檢索時發生錯誤，請稍後再試。');
    } finally {
      setInputValue('');
      setIsSubmitting(false);
      tracking.resetForNextTurn(false);
    }
  }, [
    inputValue,
    isSubmitting,
    userId,
    interfaceType,
    tracking,
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="px-6 pt-12 pb-8 md:px-12 lg:px-16">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-3">
                材質檢索系統
              </h1>
              <p className="text-muted-foreground text-lg mb-4">
                透過智能提示，快速找到最適合的材質
              </p>
              {/* 介面類型切換 + 受測者編號（研究用） */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-muted-foreground">介面類型：</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="interfaceType"
                    checked={interfaceType === 'Template'}
                    onChange={() => setInterfaceType('Template')}
                    className="rounded-full border-border"
                  />
                  引導式 (Template)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="interfaceType"
                    checked={interfaceType === 'Free-form'}
                    onChange={() => setInterfaceType('Free-form')}
                    className="rounded-full border-border"
                  />
                  自由式 (Free-form)
                </label>
                <span className="text-muted-foreground ml-4">受測者編號：</span>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="或從網址 ?userId= 帶入"
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground w-40"
                />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-16 pb-8">
            <div className="max-w-7xl mx-auto space-y-12">
              {interfaceType === 'Template' && (
                <section>
                  <h2 className="text-xl mb-6 opacity-80">材質檢索範本</h2>
                  <TemplateCard onTemplateClick={handleTemplateClick} />
                </section>
              )}

              <section>
                <ConversationInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  onFirstKeystroke={tracking.recordFirstKeystroke}
                  onFirstChar={tracking.recordFirstChar}
                  onButtonClick={tracking.recordClick}
                />
              </section>

              {lastReply && (
                <section className="max-w-4xl mx-auto">
                  <h3 className="text-lg font-medium mb-2 opacity-80">檢索結果</h3>
                  <div className="p-6 rounded-2xl border border-border bg-card whitespace-pre-wrap text-foreground">
                    {lastReply}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <HistoryPanel />
        </div>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-80 bg-background shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <HistoryPanel />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg flex items-center justify-center hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 hover:shadow-emerald-500/30 z-30"
        aria-label="開啟檢索記錄"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
      </button>
    </div>
  );
}
