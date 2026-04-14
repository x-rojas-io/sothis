import { 
    IdentificationIcon, 
    HomeModernIcon, 
    ClipboardDocumentCheckIcon, 
    HeartIcon, 
    DocumentCheckIcon 
} from '@heroicons/react/24/outline';

export interface IntakeState {
    id?: string;
    client_id?: string;
    updated_by?: string;
    full_name: string;
    phone_day: string;
    address: string;
    city_state_zip: string;
    occupation: string;
    emergency_contact: string;
    emergency_phone: string;
    initial_visit_date: string;
    date_of_birth: string;
    questions: {
        q1_massage_before: boolean | null;
        q1_frequency: string;
        q2_lying_difficulty: boolean | null;
        q2_explain: string;
        q3_allergies: boolean | null;
        q3_explain: string;
        q4_sensitive_skin: boolean | null;
        q5_contacts: boolean;
        q5_dentures: boolean;
        q5_hearing_aid: boolean;
        q6_workstation: boolean | null;
        q6_describe: string;
        q7_repetitive_movement: boolean | null;
        q7_describe: string;
        q8_stress: boolean | null;
        q8_health_affect: string;
        q8_symptoms: string[];
        q8_symptoms_other: string;
        q9_tension_pain: boolean | null;
        q9_identify: string;
        q10_goals: boolean | null;
        q10_explain: string;
        q11_under_supervision: boolean | null;
        q11_explain: string;
        q12_chiropractor: boolean | null;
        q12_frequency: string;
        q13_medication: boolean | null;
        q13_list: string;
        q14_conditions: string[];
        q14_pregnancy_months: string;
        q14_explanation: string;
        q15_useful_history: string;
    };
    concentrate_on: string[];
    consent_name: string;
    consent_at: string | null;
    therapist_signature_name: string;
    therapist_signature_at: string | null;
    therapist_signature_ip: string | null;
}

export const INITIAL_STATE: IntakeState = {
    full_name: '', phone_day: '',
    address: '', city_state_zip: '',
    occupation: '', emergency_contact: '', emergency_phone: '',
    initial_visit_date: new Date().toISOString().split('T')[0],
    date_of_birth: '',
    questions: {
        q1_massage_before: null, q1_frequency: '',
        q2_lying_difficulty: null, q2_explain: '',
        q3_allergies: null, q3_explain: '',
        q4_sensitive_skin: null,
        q5_contacts: false, q5_dentures: false, q5_hearing_aid: false,
        q6_workstation: null, q6_describe: '',
        q7_repetitive_movement: null, q7_describe: '',
        q8_stress: null, q8_health_affect: '',
        q8_symptoms: [] as string[], q8_symptoms_other: '',
        q9_tension_pain: null, q9_identify: '',
        q10_goals: null, q10_explain: '',
        q11_under_supervision: null, q11_explain: '',
        q12_chiropractor: null, q12_frequency: '',
        q13_medication: null, q13_list: '',
        q14_conditions: [] as string[], q14_pregnancy_months: '', q14_explanation: '',
        q15_useful_history: ''
    },
    concentrate_on: [] as string[],
    consent_name: '', consent_at: null,
    therapist_signature_name: '',
    therapist_signature_at: null,
    therapist_signature_ip: null
};

export const FIELD_BG = 'bg-[#fff8ee]';
export const BRAND_ORANGE = 'bg-[#f5a623]';

export const BODY_REGIONS = [
    { id: 'head_front', label: 'Head (front)' }, { id: 'neck', label: 'Neck' },
    { id: 'chest_left', label: 'Chest - left' }, { id: 'chest_right', label: 'Chest - right' },
    { id: 'abdomen_left', label: 'Abdomen - left' }, { id: 'abdomen_right', label: 'Abdomen - right' },
    { id: 'left_shoulder', label: 'Left shoulder' }, { id: 'left_upper_arm', label: 'Left upper arm' },
    { id: 'left_forearm', label: 'Left forearm' }, { id: 'left_hand', label: 'Left hand' },
    { id: 'right_shoulder', label: 'Right shoulder' }, { id: 'right_upper_arm', label: 'Right upper arm' },
    { id: 'right_forearm', label: 'Right forearm' }, { id: 'right_hand', label: 'Right hand' },
    { id: 'left_thigh_front', label: 'Left thigh (front)' }, { id: 'right_thigh_front', label: 'Right thigh (front)' },
    { id: 'left_knee', label: 'Left knee' }, { id: 'right_knee', label: 'Right knee' },
    { id: 'left_shin', label: 'Left shin' }, { id: 'right_shin', label: 'Right shin' },
    { id: 'left_foot', label: 'Left foot' }, { id: 'right_foot', label: 'Right foot' },
    { id: 'head_back', label: 'Head (back)' }, { id: 'neck_back', label: 'Neck (back)' },
    { id: 'upper_back_left', label: 'Upper back - left' }, { id: 'upper_back_right', label: 'Upper back - right' },
    { id: 'mid_back_left', label: 'Mid back - left' }, { id: 'mid_back_right', label: 'Mid back - right' },
    { id: 'lower_back_left', label: 'Lower back - left' }, { id: 'lower_back_right', label: 'Lower back - right' },
    { id: 'glutes_left', label: 'Glutes - left' }, { id: 'glutes_right', label: 'Glutes - right' },
    { id: 'left_hamstring', label: 'Left hamstring' }, { id: 'right_hamstring', label: 'Right hamstring' },
    { id: 'left_calf', label: 'Left calf' }, { id: 'right_calf', label: 'Right calf' },
    { id: 'left_heel', label: 'Left heel' }, { id: 'right_heel', label: 'Right heel' },
    { id: 'left_shoulder_back', label: 'Left shoulder (back)' },
    { id: 'left_upper_arm_back', label: 'Left upper arm (back)' },
    { id: 'left_forearm_back', label: 'Left forearm (back)' },
    { id: 'left_hand_back', label: 'Left hand (back)' },
    { id: 'right_shoulder_back', label: 'Right shoulder (back)' },
    { id: 'right_upper_arm_back', label: 'Right upper arm (back)' },
    { id: 'right_forearm_back', label: 'Right forearm (back)' },
    { id: 'right_hand_back', label: 'Right hand (back)' }
];

export const CONDITIONS = [
    "contagious skin condition", "open sores or wounds", "easy bruising",
    "recent accident or injury", "recent fracture", "recent surgery",
    "artificial joint", "sprains/strains", "current fever", "swollen glands",
    "allergies/sensitivity", "heart condition", "high or low blood pressure",
    "circulatory disorder", "varicose veins", "atherosclerosis",
    "phlebitis", "deep vein thrombosis/blood clots", 
    "joint disorder/rheumatoid arthritis/osteoarthritis/tendonitis",
    "osteoporosis", "epilepsy", "headaches/migraines", "cancer", "diabetes",
    "decreased sensation", "back/neck problems", "Fibromyalgia", "TMJ",
    "carpal tunnel syndrome", "tennis elbow", "pregnancy"
];

export const TABS = [
    { id: 1, label: 'Identification', icon: IdentificationIcon },
    { id: 2, label: 'Lifestyle', icon: HomeModernIcon },
    { id: 3, label: 'Medical History', icon: ClipboardDocumentCheckIcon },
    { id: 4, label: 'Conditions', icon: HeartIcon },
    { id: 5, label: 'Consent', icon: DocumentCheckIcon }
];
