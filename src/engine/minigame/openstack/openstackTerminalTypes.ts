export type OpenStackGamePhase =
  | 'alert'
  | 'diagnose'
  | 'isolate'
  | 'repair'
  | 'success'
  | 'failure';

export type OpenStackPlayPhase = 'diagnose' | 'isolate' | 'repair';

export type TerminalLine = {
  text: string;
  color: string;
  isCommand?: boolean;
};

export type OpenStackCommandOption = {
  command: string;
  isCorrect: boolean;
  successOutput?: string;
  errorOutput?: string;
};

export type OpenStackPhaseConfig = {
  id: OpenStackPlayPhase;
  title: string;
  prompt: string;
  options: OpenStackCommandOption[];
};
