import React, { useState } from 'react';
import styles from './EngineeringStudio.module.scss';
import { X, Cpu, Calculator, Layers, Network, RefreshCw } from 'lucide-react';
import { CalculatorsTab } from './Tabs/CalculatorsTab';
import { BlueprintCanvasTab } from './Tabs/BlueprintCanvasTab';
import { MermaidFlowTab } from './Tabs/MermaidFlowTab';
import { AdaptiveGuideTab } from './Tabs/AdaptiveGuideTab';
import { MASTER_BLUEPRINTS, getMasterBlueprintById } from '../../utils/blueprintRepository';
import type { ONIBlueprint } from '../../types/blueprint';

interface EngineeringStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

export const EngineeringStudioModal: React.FC<EngineeringStudioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat
}) => {
  const [activeTab, setActiveTab] = useState<'calculators' | 'canvas' | 'mermaid' | 'adaptive'>('calculators');
  const [currentBlueprint, setCurrentBlueprint] = useState<ONIBlueprint>(MASTER_BLUEPRINTS[0]);

  if (!isOpen) return null;

  const handleSelectBlueprint = (blueprintId: string) => {
    const bp = getMasterBlueprintById(blueprintId) || MASTER_BLUEPRINTS[0];
    setCurrentBlueprint(bp);
    setActiveTab('canvas');
  };

  const handleSendToChatAndClose = (text: string) => {
    if (onSendToChat) {
      onSendToChat(text);
    }
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Cpu size={22} color="#00e5ff" />
            <h2>ONI Engineering & Blueprint Studio V3</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Bar */}
        <div className={styles.navTabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'calculators' ? styles.active : ''}`}
            onClick={() => setActiveTab('calculators')}
          >
            <Calculator size={16} /> Calculators Panel
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'canvas' ? styles.active : ''}`}
            onClick={() => setActiveTab('canvas')}
          >
            <Layers size={16} /> Blueprint 6-Layer Canvas
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'mermaid' ? styles.active : ''}`}
            onClick={() => setActiveTab('mermaid')}
          >
            <Network size={16} /> Mermaid Logic Flow
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'adaptive' ? styles.active : ''}`}
            onClick={() => setActiveTab('adaptive')}
          >
            <RefreshCw size={16} /> Adaptive Material Guide
          </button>
        </div>

        {/* Body Content */}
        <div className={styles.bodyContent}>
          {activeTab === 'calculators' && (
            <CalculatorsTab
              onSelectBlueprint={handleSelectBlueprint}
              onSendToChat={handleSendToChatAndClose}
            />
          )}

          {activeTab === 'canvas' && (
            <BlueprintCanvasTab blueprint={currentBlueprint} />
          )}

          {activeTab === 'mermaid' && (
            <MermaidFlowTab blueprint={currentBlueprint} />
          )}

          {activeTab === 'adaptive' && (
            <AdaptiveGuideTab
              blueprint={currentBlueprint}
              onSendToChat={handleSendToChatAndClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EngineeringStudioModal;
