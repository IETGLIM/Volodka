/**
 * Канонические пороги HUD-индикаторов (v4.14.2).
 *
 * Раньше значения были разбросаны литералами по трём файлам и расходились
 * (30 в SceneTopBarHud против 25 в useHUDController/HUDChromaticEdge) —
 * аудит ANALYSIS_REPORT_PART3 §1.7/I1.4. Единый источник истины:
 *
 *  - WARN — раннее предупреждение (иконка в топбаре);
 *  - LOW/HIGH — включение активных эффектов (StatPulse-пульс, хроматическая
 *    кромка экрана).
 */
export const HUD_ENERGY_WARN_THRESHOLD = 30;
export const HUD_ENERGY_LOW_THRESHOLD = 25;
export const HUD_STRESS_HIGH_THRESHOLD = 70;
