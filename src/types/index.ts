export interface Profile {
  id: string;
  name: string;        // character name
  gameClass?: string;  // e.g. "Kain", "Adele"
  server?: string;     // e.g. "Reboot", "Bera"
  color: string;       // accent hex color for avatar
  createdAt: number;
}

export interface Session {
  id: string;
  date: string; // 'YYYY-MM-DD'
  createdAt: number;

  // Level & EXP
  lvStart: number;
  expStart: number;
  lvEnd: number;
  expEnd: number;
  expGainedActual: number;

  // Fragments
  fragsStart: number;
  fragsEnd: number;
  fragsGained: number;

  // Nodes
  nodesStart: number;
  nodesEnd: number;
  nodesGained: number;

  // Mesos
  mesosStart: number;
  mesosEnd: number;
  mesosGained: number;

  // Common Familiars
  commonFamiliarsStart: number;
  commonFamiliarsEnd: number;
  commonFamiliarsGained: number;

  // Rare Familiars
  rareFamiliarsStart: number;
  rareFamiliarsEnd: number;
  rareFamiliarsGained: number;

  notes?: string;
  profileId?: string;
}

export interface PeriodStats {
  totalExpGained: number;
  totalFragsGained: number;
  totalNodesGained: number;
  totalMesosGained: number;
  totalCommonFamiliarsGained: number;
  totalRareFamiliarsGained: number;
  lvStart: number;
  expStart: number;
  lvEnd: number;
  expEnd: number;
  sessionCount: number;
}

export interface OpenSession {
  id: string;
  date: string;
  startedAt: number;
  profileId: string;
  lvStart: number;
  expStart: number;
  fragsStart: number;
  nodesStart: number;
  mesosStart: number;
  commonFamiliarsStart: number;
  rareFamiliarsStart: number;
  notes?: string;
}

export type RootStackParamList = {
  MainTabs: undefined;
  AddSession: { sessionId?: string } | undefined;
  SessionDetail: { sessionId: string };
  Profiles: undefined;
  StartSession: { editing?: boolean } | undefined;
  FinishSession: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Stats: undefined;
};
