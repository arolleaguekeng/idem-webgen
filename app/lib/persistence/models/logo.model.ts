export interface LogoModel {
  id: string;
  name: string;
  svg: string;
  concept: string;
  colors: string[];
  fonts: string[];

  variations?: {
    lightBackground?: string;
    darkBackground?: string;
    monochrome?: string;
  };
}
