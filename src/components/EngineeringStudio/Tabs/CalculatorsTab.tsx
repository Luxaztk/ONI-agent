import React, { useState } from 'react';
import {
  calculateSPOM,
  calculateATSTCooling,
  calculateFoodAndResource,
  calculatePipelineBalance,
  COOLANTS,
  FOOD_DATABASE,
  GEYSER_TYPES
} from '../../../utils/oniCalculators';
import styles from './CalculatorsTab.module.scss';
import { Zap, Flame, Utensils, Activity, ArrowRight, MessageSquarePlus, Sprout, Thermometer, Droplets, Sun, Sparkles } from 'lucide-react';

interface CalculatorsTabProps {
  onSelectBlueprint: (blueprintId: string) => void;
  onSendToChat: (text: string) => void;
}

export const CalculatorsTab: React.FC<CalculatorsTabProps> = ({ onSelectBlueprint, onSendToChat }) => {
  const [subTab, setSubTab] = useState<'spom' | 'cooling' | 'food' | 'pipeline'>('spom');

  // State SPOM
  const [dupCount, setDupCount] = useState<number>(8);
  
  // State Cooling
  const [coolant, setCoolant] = useState<string>('Nước bẩn (Polluted Water)');
  const [targetDTU, setTargetDTU] = useState<number>(800);

  // State Food
  const [foodDups, setFoodDups] = useState<number>(10);
  const [kcalPerDup, setKcalPerDup] = useState<number>(1000);
  const [selectedFood, setSelectedFood] = useState<string>('Mealwood (Bánh sâu / Mealloaf)');
  const [useFertilizerBoost, setUseFertilizerBoost] = useState<boolean>(false);

  // State Pipeline
  const [selectedGeyser, setSelectedGeyser] = useState<string>('cool_steam');
  const [emissionRate, setEmissionRate] = useState<number>(3.5);
  const [activeRatio, setActiveRatio] = useState<number>(60);

  // Results
  const spomRes = calculateSPOM(dupCount);
  const coolingRes = calculateATSTCooling(coolant, targetDTU);
  const foodRes = calculateFoodAndResource(foodDups, selectedFood, kcalPerDup, useFertilizerBoost);
  const pipelineRes = calculatePipelineBalance(selectedGeyser, emissionRate, activeRatio);

  const handleSendSPOMToChat = () => {
    const msg = `[SPOM Request] Tôi vừa tính toán SPOM cho ${spomRes.dupCount} Duplicants:\n- Nhu cầu Oxy: ${spomRes.requiredO2GPerSec} g/s\n- Máy điện phân cần: ${spomRes.electrolyzerCount} máy\n- Nước cấp: ${spomRes.waterRequiredKgPerSec} kg/s\n- Cân bằng điện: ${spomRes.netPowerW >= 0 ? '+' : ''}${spomRes.netPowerW}W (${spomRes.isSelfPowered ? 'Self-Powered Tự Cấp' : 'Thiếu Điện'})\nNhờ AI hướng dẫn đi đường ống và cài đặt Automation cho sơ đồ này!`;
    onSendToChat(msg);
  };

  const handleSendCoolingToChat = () => {
    const msg = `[Cooling Request] Tôi cần giải nhiệt ${coolingRes.targetDTUPerSec} kDTU/s bằng ${coolingRes.coolantName}:\n- Cần ${coolingRes.aquatunerCount} Aquatuner (Tổng làm mát ${coolingRes.totalAquatunerCoolingKDTU} kDTU/s)\n- Cần ${coolingRes.steamTurbineCount} Steam Turbine tiêu tán nhiệt\n- Cân bằng điện net: ${coolingRes.netPowerW}W\nNhờ AI tư vấn chất liệu xây dựng phòng hơi nước và van bypass an toàn!`;
    onSendToChat(msg);
  };

  const handleSendFoodToChat = () => {
    const resText = foodRes.resources.length > 0
      ? foodRes.resources.map(r => 
          `- ${r.name}: ${r.amountPerCycleKg.toLocaleString()} kg/chu kỳ${r.rateKgPerSec ? ` (${r.rateKgPerSec} kg/s)` : ''} [100 chu kỳ: ${r.total100CyclesKg >= 1000 ? `${(r.total100CyclesKg / 1000).toFixed(1)} Tấn` : `${r.total100CyclesKg} kg`}]`
        ).join('\n')
      : '- Không tốn tài nguyên bón/tưới đặc biệt (Chỉ tốn công Duplicant thu hoạch)';

    const msg = `[Food & Farming Request] Tôi vừa tính toán nhu cầu nông nghiệp cho ${foodRes.dupCount} Duplicants (${foodRes.kcalPerDup} kcal/đệ/chu kỳ):\n` +
      `- Món ăn chọn: ${foodRes.selectedFood}\n` +
      `- Tổng Calo cần: ${foodRes.totalKcalPerCycle.toLocaleString()} kcal/chu kỳ\n` +
      `- Số cây/thú cần nuôi: ${foodRes.crittersCount > 0 ? `${foodRes.crittersCount} con` : `${foodRes.plantsCount} cây (${foodRes.useFertilizerBoost ? 'Đã bật Phân Bón Nông Dân +100% Tốc Độ' : 'Trồng tự nhiên'})`}\n` +
      `- Thời gian lớn / thu hoạch: ${foodRes.cyclesToGrowEffective} chu kỳ\n` +
      `Tài nguyên tiêu thụ:\n${resText}\n` +
      `Điều kiện môi trường: Nhiệt độ ${foodRes.tempRange} (${foodRes.idealTemp}), Khí quyển: ${foodRes.atmosphereRequired}, Ánh sáng: ${foodRes.lightRequired}.\n` +
      `Nhờ AI tư vấn thiết kế nông trại tự động hóa, kiểm soát nhiệt độ và cách bố trí tối ưu nhất!`;
    onSendToChat(msg);
  };

  return (
    <div className={styles.tabContainer}>
      <div className={styles.calcHeader}>
        <button
          className={`${styles.calcSubTab} ${subTab === 'spom' ? styles.active : ''}`}
          onClick={() => setSubTab('spom')}
        >
          <Zap size={16} /> SPOM Calculator
        </button>
        <button
          className={`${styles.calcSubTab} ${subTab === 'cooling' ? styles.active : ''}`}
          onClick={() => setSubTab('cooling')}
        >
          <Flame size={16} /> AT/ST Cooling
        </button>
        <button
          className={`${styles.calcSubTab} ${subTab === 'food' ? styles.active : ''}`}
          onClick={() => setSubTab('food')}
        >
          <Utensils size={16} /> Food & Farming
        </button>
        <button
          className={`${styles.calcSubTab} ${subTab === 'pipeline' ? styles.active : ''}`}
          onClick={() => setSubTab('pipeline')}
        >
          <Activity size={16} /> Geyser Pipeline
        </button>
      </div>

      {subTab === 'spom' && (
        <div className={styles.calcBody}>
          <div className={styles.inputCard}>
            <h3><Zap size={18} /> Nhập Thông Số SPOM</h3>
            <div className={styles.formGroup}>
              <label>Số đệ Duplicants: <span className={styles.valDisplay}>{dupCount} Dups</span></label>
              <input
                type="range"
                min="1"
                max="40"
                value={dupCount}
                onChange={(e) => setDupCount(parseInt(e.target.value))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Mức tiêu thụ O2 chuẩn: 100g/s per Duplicant</label>
            </div>
          </div>

          <div className={styles.resultCard}>
            <h3>Kết Quả Tính Toán SPOM</h3>
            <div className={styles.statGrid}>
              <div className={`${styles.statItem} ${styles.highlight}`}>
                <div className={styles.statLabel}>Oxy Cần Cấp</div>
                <div className={styles.statVal}>{spomRes.requiredO2GPerSec} g/s</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Máy Điện Phân</div>
                <div className={styles.statVal}>{spomRes.electrolyzerCount} máy</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Nước Sạch Cấp</div>
                <div className={styles.statVal}>{spomRes.waterRequiredKgPerSec} kg/s</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Bơm Khí O2 / H2</div>
                <div className={styles.statVal}>{spomRes.o2PumpsCount} O2 / {spomRes.h2PumpsCount} H2</div>
              </div>
              <div className={`${styles.statItem} ${spomRes.isSelfPowered ? styles.success : styles.warning}`}>
                <div className={styles.statLabel}>Cân Bằng Điện</div>
                <div className={styles.statVal}>{spomRes.netPowerW >= 0 ? '+' : ''}{spomRes.netPowerW} W</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Trạng Thái</div>
                <div className={styles.statVal}>{spomRes.isSelfPowered ? '⚡ Tự Cấp Điện' : '⚠️ Cần Điện Ngoài'}</div>
              </div>
            </div>

            <div className={styles.actionRow}>
              <button className={styles.btnPrimary} onClick={() => onSelectBlueprint(spomRes.recommendedBlueprintId)}>
                Xem Bản Vẽ Master <ArrowRight size={16} />
              </button>
              <button className={styles.btnSecondary} onClick={handleSendSPOMToChat}>
                <MessageSquarePlus size={16} /> Hỏi AI
              </button>
            </div>
          </div>
        </div>
      )}

      {subTab === 'cooling' && (
        <div className={styles.calcBody}>
          <div className={styles.inputCard}>
            <h3><Flame size={18} /> Nhập Thông Số Làm Mát</h3>
            <div className={styles.formGroup}>
              <label>Loại Chất Làm Mát (Coolant):</label>
              <select value={coolant} onChange={(e) => setCoolant(e.target.value)}>
                {COOLANTS.map(c => (
                  <option key={c.name} value={c.name}>{c.name} (SHC: {c.shc})</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Tải Nhiệt Cần Làm Mát: <span className={styles.valDisplay}>{targetDTU} kDTU/s</span></label>
              <input
                type="range"
                min="100"
                max="3000"
                step="50"
                value={targetDTU}
                onChange={(e) => setTargetDTU(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.resultCard}>
            <h3>Kết Quả Giải Nhiệt AT/ST</h3>
            <div className={styles.statGrid}>
              <div className={`${styles.statItem} ${styles.highlight}`}>
                <div className={styles.statLabel}>Số Aquatuner</div>
                <div className={styles.statVal}>{coolingRes.aquatunerCount} máy</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Công Suất AT/máy</div>
                <div className={styles.statVal}>{coolingRes.aquatunerCoolingPerUnitKDTU} kDTU/s</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Steam Turbine Cần</div>
                <div className={styles.statVal}>{coolingRes.steamTurbineCount} máy</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Điện Năng Mạch ST</div>
                <div className={styles.statVal}>+{coolingRes.turbinePowerGeneratedW} W</div>
              </div>
            </div>

            <div className={styles.actionRow}>
              <button className={styles.btnPrimary} onClick={() => onSelectBlueprint(coolingRes.recommendedBlueprintId)}>
                Xem Bản Vẽ Master <ArrowRight size={16} />
              </button>
              <button className={styles.btnSecondary} onClick={handleSendCoolingToChat}>
                <MessageSquarePlus size={16} /> Hỏi AI
              </button>
            </div>
          </div>
        </div>
      )}

      {subTab === 'food' && (
        <div className={styles.calcBody}>
          <div className={styles.inputCard}>
            <h3><Utensils size={18} /> Nhập Thông Số Nông Nghiệp & Duplicants</h3>
            <div className={styles.formGroup}>
              <label>Số đệ Duplicants: <span className={styles.valDisplay}>{foodDups} Dups</span></label>
              <div className={styles.inlineRangeInput}>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={foodDups}
                  onChange={(e) => setFoodDups(parseInt(e.target.value) || 1)}
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  className={styles.smallNumInput}
                  value={foodDups}
                  onChange={(e) => setFoodDups(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Mức tiêu thụ Calo / đệ / chu kỳ:</label>
              <select value={kcalPerDup} onChange={(e) => setKcalPerDup(parseInt(e.target.value))}>
                <option value={500}>500 kcal (Biếng ăn / Độ khó rất dễ)</option>
                <option value={750}>750 kcal (Anorexic trait)</option>
                <option value={1000}>1,000 kcal (Mặc định chuẩn ONI)</option>
                <option value={1500}>1,500 kcal (Bottomless Stomach / Độ khó khó)</option>
                <option value={2000}>2,000 kcal (Độ khó rất khó)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Món Ăn / Cây Trồng Chính:</label>
              <select value={selectedFood} onChange={(e) => setSelectedFood(e.target.value)}>
                {Object.keys(FOOD_DATABASE).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={useFertilizerBoost}
                  onChange={(e) => setUseFertilizerBoost(e.target.checked)}
                />
                <span><Sparkles size={14} className={styles.iconSparkle} /> Dùng Phân Bón Nông Dân (Farmer's Touch +100% Tốc Độ)</span>
              </label>
              <p className={styles.subHint}>
                Trạm nông nghiệp (Agricultural Station) tăng 100% tốc độ lớn, giảm 50% số cây trồng cần thiết.
              </p>
            </div>
          </div>

          <div className={styles.resultCard}>
            <h3><Sprout size={18} /> Nhu Cầu Calo, Cây Trồng & Tài Nguyên</h3>
            
            <div className={styles.statGrid}>
              <div className={`${styles.statItem} ${styles.highlight}`}>
                <div className={styles.statLabel}>Tổng Calo / Chu Kỳ</div>
                <div className={styles.statVal}>{foodRes.totalKcalPerCycle.toLocaleString()} kcal</div>
              </div>
              <div className={`${styles.statItem} ${styles.highlight}`}>
                <div className={styles.statLabel}>{foodRes.crittersCount > 0 ? 'Số Thú Nuôi Cần' : 'Số Cây Trồng Cần'}</div>
                <div className={styles.statVal}>
                  {foodRes.crittersCount > 0 ? `${foodRes.crittersCount} con` : `${foodRes.plantsCount} cây`}
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Sản Lượng Calo/Cây/Chu kỳ</div>
                <div className={styles.statVal}>{foodRes.kcalPerPlantPerCycle} kcal</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Thời Gian Lớn / Thu Hoạch</div>
                <div className={styles.statVal}>{foodRes.cyclesToGrowEffective} chu kỳ</div>
              </div>
            </div>

            {/* Resource Consumption Table / List */}
            <div className={styles.resourceSection}>
              <h4>Tài Nguyên Nuôi Cây (Tiêu thụ mỗi chu kỳ):</h4>
              {foodRes.resources.length === 0 ? (
                <div className={styles.emptyResourceNotice}>
                  Cây trồng không tiêu thụ tài nguyên tưới/bón trực tiếp (Chỉ tốn công Duplicant chăm sóc).
                </div>
              ) : (
                <div className={styles.resourceList}>
                  {foodRes.resources.map(r => (
                    <div key={r.name} className={styles.resourceCardItem}>
                      <div className={styles.resName}>{r.name}</div>
                      <div className={styles.resAmounts}>
                        <span className={styles.resCycleVal}>
                          <strong>{r.amountPerCycleKg.toLocaleString()}</strong> kg/chu kỳ
                          {r.rateKgPerSec ? ` (${r.rateKgPerSec} kg/s)` : ''}
                        </span>
                        <span className={styles.res100CycleVal}>
                          100 chu kỳ: <strong>{r.total100CyclesKg >= 1000 ? `${(r.total100CyclesKg / 1000).toFixed(1)} Tấn` : `${r.total100CyclesKg} kg`}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Environmental Requirements */}
            <div className={styles.envSection}>
              <h4>Yêu Cầu Môi Trường & Nông Trại:</h4>
              <div className={styles.envGrid}>
                <div className={styles.envBadge}>
                  <Thermometer size={14} /> <strong>Nhiệt độ:</strong> {foodRes.tempRange} (Lý tưởng {foodRes.idealTemp})
                </div>
                <div className={styles.envBadge}>
                  <Droplets size={14} /> <strong>Khí quyển:</strong> {foodRes.atmosphereRequired}
                </div>
                <div className={styles.envBadge}>
                  <Sun size={14} /> <strong>Ánh sáng:</strong> {foodRes.lightRequired}
                </div>
              </div>
              {foodRes.notes && <p className={styles.envNote}>💡 {foodRes.notes}</p>}
            </div>

            <div className={styles.actionRow}>
              <button className={styles.btnSecondary} onClick={handleSendFoodToChat}>
                <MessageSquarePlus size={16} /> Hỏi AI Sơ Đồ Nông Trại
              </button>
            </div>
          </div>
        </div>
      )}

      {subTab === 'pipeline' && (
        <div className={styles.calcBody}>
          <div className={styles.inputCard}>
            <h3><Activity size={18} /> Cân Bằng Mạch Nước / Volcano</h3>
            <div className={styles.formGroup}>
              <label>Loại Mạch Phun:</label>
              <select value={selectedGeyser} onChange={(e) => setSelectedGeyser(e.target.value)}>
                {GEYSER_TYPES.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Tốc độ phun khi hoạt động: <span className={styles.valDisplay}>{emissionRate} kg/s</span></label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="20"
                value={emissionRate}
                onChange={(e) => setEmissionRate(parseFloat(e.target.value) || 1)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Tỷ lệ chu kỳ phun (Active Ratio): <span className={styles.valDisplay}>{activeRatio}%</span></label>
              <input
                type="range"
                min="10"
                max="100"
                value={activeRatio}
                onChange={(e) => setActiveRatio(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.resultCard}>
            <h3>Pipeline Processing Yield</h3>
            <div className={styles.statGrid}>
              <div className={`${styles.statItem} ${styles.highlight}`}>
                <div className={styles.statLabel}>Sản Lượng Trung Bình</div>
                <div className={styles.statVal}>{pipelineRes.avgYieldKgPerSec} kg/s</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Tải Nhiệt Cần Giải</div>
                <div className={styles.statVal}>{pipelineRes.coolingNeededKDTU} kDTU/s</div>
              </div>
            </div>
            <div className={styles.actionRow}>
              <button className={styles.btnPrimary} onClick={() => onSelectBlueprint(pipelineRes.recommendedBlueprintId)}>
                Xem Bản Vẽ Thuần Hóa Master <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
