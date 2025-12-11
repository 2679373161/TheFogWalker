'use client';

import { useState, useEffect } from 'react';
import { Wind, Hourglass, Shuffle, EyeOff, GitCompare, Power, BookOpen, Clock, X, Lock } from 'lucide-react';
import { IntroScreen } from '../components/modules/IntroScreen';
import { SedimentFilter } from '../components/modules/SedimentFilter';
import { Wormhole } from '../components/modules/Wormhole';
import { LabellessReader } from '../components/modules/LabellessReader';
import { OpinionCollider } from '../components/modules/OpinionCollider';
import { DigitalSabbath } from '../components/modules/DigitalSabbath';
import { NavBtn } from '../components/NavBtn';

export default function TheFogWalker() {
  const [activeTab, setActiveTab] = useState('intro');
  const [isSabbath, setIsSabbath] = useState(false);

  // 模拟安息日模式
  useEffect(() => {
    if (isSabbath) {
      document.body.style.overflow = 'hidden';
    } else {
          document.body.style.overflow = 'auto';
    }
  }, [isSabbath]);

  const renderContent = () => {
    switch (activeTab) {
      case 'intro': return <IntroScreen onChangeTab={setActiveTab} />;
      case 'sediment': return <SedimentFilter />;
      case 'wormhole': return <Wormhole />;
      case 'labelless': return <LabellessReader />;
      case 'collider': return <OpinionCollider />;
          default: return <IntroScreen onChangeTab={setActiveTab} />;
    }
  };

  if (isSabbath) {
    return <DigitalSabbath onUnlock={() => setIsSabbath(false)} />;
  }

  return (
    <div className="min-h-screen text-stone-300 font-serif selection:bg-stone-700 selection:text-white flex flex-col items-center">
      {/* 顶部极简导航 */}
      <header className="w-full max-w-3xl p-6 flex justify-between items-center border-b border-neutral-800">
        <div
          className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
          onClick={() => setActiveTab('intro')}
        >
          <Wind className="w-5 h-5 text-stone-500" />
          <span className="tracking-[0.2em] uppercase text-sm font-bold text-stone-400">The Fog Walker</span>
        </div>
        <button
          onClick={() => setIsSabbath(true)}
          className="group flex items-center gap-2 text-xs text-neutral-600 hover:text-red-900 transition-all"
        >
          <Power className="w-4 h-4 group-hover:scale-110" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">关机</span>
        </button>
      </header>

      {/* 主内容区 */}
      <main className="w-full max-w-2xl flex-1 p-6 md:p-12 animate-in fade-in duration-1000">
        {renderContent()}
      </main>

      {/* 底部功能导航 - 模拟机械开关 */}
      <nav className="fixed bottom-8 bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-full px-6 py-3 flex gap-8 shadow-2xl shadow-black">
        <NavBtn id="sediment" icon={Hourglass} label="沉淀池" active={activeTab} set={setActiveTab} />
        <NavBtn id="wormhole" icon={Shuffle} label="虫洞" active={activeTab} set={setActiveTab} />
        <NavBtn id="labelless" icon={EyeOff} label="去标签" active={activeTab} set={setActiveTab} />
        <NavBtn id="collider" icon={GitCompare} label="对撞机" active={activeTab} set={setActiveTab} />
      </nav>
    </div>
  );
}
