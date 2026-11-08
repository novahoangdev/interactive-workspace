export type SectionId = 'overview' | 'profile' | 'projects' | 'skills' | 'experience' | 'contact';

export type LightingMode = 'morning' | 'day' | 'sunset' | 'night';

export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Enterprise UI' | 'E-Commerce' | 'EdTech & AI' | 'Media & HealthTech' | 'WebGL & 3D' | 'Frontend & AI' | 'Web Apps' | 'Open Source' | string;
  description: string;
  longDescription: string;
  role: string;
  year: string;
  tags: string[];
  metrics: string[];
  githubUrl?: string;
  liveUrl?: string;
  color: string;
  featured?: boolean;
}

export interface SkillCategory {
  title: string;
  iconName: string;
  skills: {
    name: string;
    highlight?: boolean;
  }[];
}

export interface ExperienceItem {
  period: string;
  role: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Contract' | 'Open Source';
  description: string;
  achievements: string[];
  technologies: string[];
}

export interface EducationItem {
  period: string;
  degree: string;
  school: string;
  details?: string;
}

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export type CameraViewMode = 'default' | 'desk-focus' | 'isometric' | 'top-down' | 'free';

export interface WorkstationToast {
  id: string;
  title: string;
  message: string;
  icon?: string;
  type?: 'info' | 'success' | 'code';
  actionUrl?: string;
  actionLabel?: string;
}
