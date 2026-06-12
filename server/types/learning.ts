export interface Lesson {
  id: string;
  skill_path_id: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  duration: string;
  description: string;
  rich_content: string;
  xp_reward: number;
}

export interface SkillPath {
  id: string;
  title: string;
  category: string;
  description: string;
  xp_total: number;
  featured_img: string;
  lessons?: Lesson[];
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string;
  score?: number;
}

export interface PathCompletionRate {
  pathId: string;
  pathTitle: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
}

export interface LearningDashboard {
  totalXp: number;
  completedLessonsCount: number;
  activePathStatuses: PathCompletionRate[];
}

export interface LessonRecommendation {
  lesson: Lesson;
  reason: string;
  difficultyScale: 'green' | 'amber' | 'red';
}
