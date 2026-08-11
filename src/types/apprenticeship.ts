export interface Apprenticeship {
  id: string;
  mentor_id: string;
  learner_id: string | null;
  training_id: string | null;
  title: string;
  description: string | null;
  skill_area: string;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  mentor_profile?: {
    full_name: string;
    hustle_name: string;
    avatar_url: string;
  };
  learner_profile?: {
    full_name: string;
    hustle_name: string;
    avatar_url: string;
  };
}

export interface ApprenticeshipApplication {
  id: string;
  apprenticeship_id: string;
  applicant_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  applicant_profile?: {
    full_name: string;
    hustle_name: string;
    avatar_url: string;
  };
}

export interface ApprenticeshipProgress {
  id: string;
  apprenticeship_id: string;
  learner_id: string;
  milestone_title: string;
  description: string | null;
  completion_status: boolean;
  completed_at: string | null;
  order: number;
  created_at: string;
}

export interface Certification {
  id: string;
  apprenticeship_id: string;
  learner_id: string;
  certificate_title: string;
  issued_at: string;
  verification_code: string;
}
