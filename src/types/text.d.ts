export interface TextConfig {
  text: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  isBold?: boolean;
  isUnderline?: boolean;
  isItalic?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  fontStyle?: '标题1' | '标题2' | '标题3' | '标题4' | '正文';
  fontEffect?: string;
}
