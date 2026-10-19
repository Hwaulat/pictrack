import { useSyncExternalStore } from "react";

export type Language = "en" | "id";

export const translations = {
  en: {
    // Shell & Nav
    admin: "Admin",
    exit: "Exit",
    toggle_theme_light: "Switch to light mode",
    toggle_theme_dark: "Switch to dark mode",
    select_language: "Select language",
    english: "English",
    indonesian: "Indonesia",

    // Index
    window_open: "Feedback window · open",
    index_title: "Tell us how the Ragdalion team performed.",
    index_desc: "Rate each sales and technical person who worked on your project. About two minutes per person. No account needed.",
    access_code: "Access code / Customer PIN",
    continue_btn: "Continue →",
    code_invalid: "That PIN or code didn't work. Check it and try again.",
    too_many_attempts: "Too many attempts. Try again in 15 minutes.",
    demo_codes: "Demo PINs & Codes:",
    code_placeholder: "Enter 6-digit PIN or Code",

    // Vendors
    team_meta_title: "Your project team — Ragdalion Feedback",
    team_meta_desc: "Rate each Ragdalion sales and technical team member on your project.",
    please_enter_code: "Please enter your code or PIN first.",
    enter_code_link: "enter your code",
    your_team: (vendor: string) => `Tim ${vendor}`,
    rated_progress: (done: number, total: number, date: string, days: number) =>
      `${done} of ${total} rated · closes ${date} · ${days} days left`,
    sales_team: "Sales team",
    technical_team: "Technical team",
    company_team: "Ragdalion / Office Evaluation",
    company_eval_card_title: (vendor: string) => `${vendor} (Office & Company Evaluation)`,
    company_eval_card_desc: "Rate company-level collaboration, service delivery, what needs attention, and what needs development.",
    company_eval_badge: "Office & Company",
    attention_points_label: "What should Ragdalion pay attention to or improve?",
    attention_points_placeholder: "Note any specific points of concern, process bottlenecks, or critical areas needing attention...",
    improvement_points_label: "What should be developed for future collaboration?",
    improvement_points_placeholder: "Note any services, innovations, or enhancements you would like to see developed...",
    status_submitted: "Submitted",
    status_draft: "Draft",
    status_not_started: "Not started",

    // Feedback
    feedback_meta_title: "Rate a team member — Ragdalion Feedback",
    back_to_team: "← Team",
    step_rate: "Rate",
    step_review: "Review",
    not_applicable: "Not applicable",
    add_comment_label: (name: string) => `Anything you would like to add about ${name}?`,
    comment_required: "Please tell us why — a comment is required for low ratings.",
    btn_back: "Back",
    btn_next: "Next →",
    btn_submit: "Submit feedback",
    submitting: "Submitting...",
    review_title: "Review your answers",
    review_desc: "Check your answers before submitting. You can still edit them later until the feedback window closes.",
    btn_edit_answers: "← Edit answers",

    // Done
    done_received: "✓ Received",
    done_title: "Thank you.",
    done_desc: "You can edit your answers until the feedback window closes.",
    done_back: "Back to vendors",

    // Admin Tabs & Management
    admin_meta_title: "Team performance — Ragdalion Feedback",
    admin_tag: "Dashboard · Ragdalion",
    admin_title: "Team performance & management",
    tab_overview: "Overview & Performance",
    tab_customers: "Customers & PINs",
    tab_team: "Team Members",

    stat_projects: "Projects",
    stat_ratings_expected: "Ratings expected",
    stat_submitted: "Submitted",
    section_projects: "Projects",
    section_people: "People",
    section_company_eval: "Ragdalion / Office Evaluation",
    company_eval_subtitle: "Client ratings on company performance, critical attention points, and development recommendations.",
    no_company_evals: "No company evaluations submitted yet.",
    filter_all: "All",
    filter_sales: "Sales",
    filter_technical: "Technical",
    ratings_count: "ratings",
    projects_count: "projects",
    rated_count: "rated",
    score_waiting: "Waiting",
    admin_footnote: "Low-score flag below 3.0 · Members may work on multiple projects — expand row to inspect.",

    // Feature 1: Customer & PINs
    add_customer: "+ New Customer & PIN",
    customer_col: "Customer",
    project_col: "Project",
    pin_col: "Login PIN",
    status_col: "Ratings",
    deadline_col: "Deadline",
    team_assigned_col: "Assigned Team",
    copy_pin: "Copy PIN",
    toast_pin_copied: "PIN copied to clipboard!",
    modal_add_customer_title: "Add New Customer & Project",
    modal_add_customer_desc: "Enter customer and project details. A secure login PIN will be automatically generated for them.",
    input_customer_name: "Customer / Client Name",
    placeholder_customer_name: "e.g. PT Telekomunikasi Indonesia",
    input_project_name: "Project Name",
    placeholder_project_name: "e.g. Core System Cloud Migration",
    input_duration_days: "Feedback Window Duration (Days)",
    auto_pin_label: "Auto-generated Login PIN",
    regenerate_pin: "Generate new",
    assign_team_label: "Assign Team Members (Sales & Technical)",
    btn_create_customer: "Create Customer & Generate PIN",
    toast_customer_created: "Customer created successfully with PIN:",
    no_team_assigned: "No team members assigned yet",
    customer_card_hint: "Give this 6-digit PIN to the customer to log in directly on the homepage.",

    // Feature 2: Team Members
    add_team_member: "+ Add Team Member",
    modal_add_user_title: "Add New Team Member",
    modal_add_user_desc: "Add a sales or technical person and choose which projects they belong to.",
    input_user_name: "Full Name",
    placeholder_user_name: "e.g. Hendro Kusumo",
    input_user_title: "Job Title",
    placeholder_user_title: "e.g. Senior Solution Architect",
    input_user_role: "Department / Team",
    role_sales_desc: "Sales, Account Executives, Presales",
    role_tech_desc: "Engineers, Architects, Developers, Support",
    assign_projects_label: "Assign to Project(s)",
    btn_create_user: "Save Team Member",
    toast_user_created: "Team member added successfully!",
    assigned_projects: "Assigned Projects",
    no_projects_assigned: "Not assigned to any project yet",
    no_customers_found: "No customers created yet",
    no_members_found: "No team members found",
    delete_confirm: "Are you sure you want to delete this?",

    // Security & Supabase
    admin_auth_title: "Administrator Authentication",
    admin_auth_desc: "Enter the administrator security passcode to manage team members, customers, and view reports.",
    admin_passcode_label: "Admin Security Passcode",
    admin_passcode_placeholder: "Enter administrator passcode",
    admin_login_btn: "Unlock Admin Access →",
    admin_logout_btn: "Lock / Logout Admin",
    admin_passcode_invalid: "Invalid admin passcode.",
    admin_locked_message: "Admin access locked due to multiple incorrect attempts. Try again in 15 minutes.",
    attempts_remaining: (left: number) => `${left} attempt(s) remaining before security lockout`,
    supabase_sync_success: "Database synchronized with Supabase cloud.",
    db_status_title: "Database Status",
    db_clean_active: "Clean Database Active (Zero Dummy Data)",
    no_projects_yet: "No customer projects yet. Click '+ New Customer & PIN' above to create your first customer.",
    no_team_yet: "No team members yet. Click '+ Add Team Member' above to add sales or technical personnel.",

    // Scale
    scale: ["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"],

    // Questions
    questions: {
      sales: [
        "Responsiveness to requests",
        "Clarity of proposal and quotation",
        "Transparency on price and scope changes",
        "Communication and relationship",
        "Overall satisfaction",
      ],
      technical: [
        "Quality of work delivered",
        "Adherence to schedule",
        "Technical competence",
        "Handling of problems and support",
        "Communication on progress",
        "Overall satisfaction",
      ],
      company: [
        "Ease of coordination & communication with Ragdalion",
        "Overall quality & reliability of solutions delivered",
        "Transparency, governance, and commitment adherence",
        "Professionalism and organizational culture",
        "Overall satisfaction partnering with Ragdalion",
      ],
    },
  },
  id: {
    // Shell & Nav
    admin: "Admin",
    exit: "Keluar",
    toggle_theme_light: "Ganti ke mode terang",
    toggle_theme_dark: "Ganti ke mode gelap",
    select_language: "Pilih bahasa",
    english: "English",
    indonesian: "Indonesia",

    // Index
    window_open: "Periode feedback · dibuka",
    index_title: "Beri tahu kami bagaimana kinerja tim Ragdalion.",
    index_desc: "Nilai setiap anggota tim sales dan teknis yang menangani proyek Anda. Sekitar dua menit per orang. Tidak perlu akun.",
    access_code: "Kode Akses / PIN Customer",
    continue_btn: "Lanjut →",
    code_invalid: "PIN atau kode tersebut tidak valid. Periksa dan coba lagi.",
    too_many_attempts: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.",
    demo_codes: "Demo PIN & Kode:",
    code_placeholder: "Masukkan 6-digit PIN atau Kode",

    // Vendors
    team_meta_title: "Tim proyek — Feedback Ragdalion",
    team_meta_desc: "Nilai setiap anggota tim sales dan teknis Ragdalion pada proyek Anda.",
    please_enter_code: "Silakan masukkan kode atau PIN Anda terlebih dahulu.",
    enter_code_link: "masukkan kode Anda",
    your_team: (vendor: string) => `Tim ${vendor}`,
    rated_progress: (done: number, total: number, date: string, days: number) =>
      `${done} dari ${total} dinilai · ditutup ${date} · sisa ${days} hari`,
    sales_team: "Tim Sales",
    technical_team: "Tim Teknis",
    company_team: "Evaluasi Ragdalion / Kantor",
    company_eval_card_title: (vendor: string) => `${vendor} (Evaluasi Kantor & Layanan Perusahaan)`,
    company_eval_card_desc: "Beri masukan mengenai kualitas layanan perusahaan, hal yang perlu diperhatikan, dan saran pengembangan ke depan.",
    company_eval_badge: "Kantor & Perusahaan",
    attention_points_label: "Apa yang perlu diperhatikan / dievaluasi dari Ragdalion?",
    attention_points_placeholder: "Tuliskan hal-hal yang perlu diperhatikan atau dievaluasi dari kinerja atau koordinasi Ragdalion...",
    improvement_points_label: "Apa yang perlu dikembangkan untuk kerja sama ke depan?",
    improvement_points_placeholder: "Tuliskan saran pengembangan layanan, inovasi, atau peningkatan yang diharapkan...",
    status_submitted: "Terkirim",
    status_draft: "Draf",
    status_not_started: "Belum dimulai",

    // Feedback
    feedback_meta_title: "Nilai anggota tim — Feedback Ragdalion",
    back_to_team: "← Tim",
    step_rate: "Penilaian",
    step_review: "Tinjauan",
    not_applicable: "Tidak berlaku",
    add_comment_label: (name: string) => `Ada yang ingin Anda tambahkan tentang ${name}?`,
    comment_required: "Mohon berikan alasan — komentar wajib diisi untuk penilaian rendah.",
    btn_back: "Kembali",
    btn_next: "Lanjut →",
    btn_submit: "Kirim feedback",
    submitting: "Mengirimkan...",
    review_title: "Tinjau jawaban Anda",
    review_desc: "Periksa jawaban Anda sebelum dikirim. Anda masih dapat mengubahnya hingga periode feedback ditutup.",
    btn_edit_answers: "← Ubah jawaban",

    // Done
    done_received: "✓ Diterima",
    done_title: "Terima kasih.",
    done_desc: "Anda masih dapat mengubah jawaban hingga batas waktu penutupan feedback.",
    done_back: "Kembali ke tim vendor",

    // Admin Tabs & Management
    admin_meta_title: "Kinerja tim & manajemen — Feedback Ragdalion",
    admin_tag: "Dasbor · Ragdalion",
    admin_title: "Kinerja tim & manajemen",
    tab_overview: "Ringkasan & Kinerja",
    tab_customers: "Customer & PIN",
    tab_team: "Anggota Tim",

    stat_projects: "Proyek",
    stat_ratings_expected: "Ekspektasi penilaian",
    stat_submitted: "Terkirim",
    section_projects: "Daftar Proyek",
    section_people: "Anggota Tim",
    section_company_eval: "Evaluasi Ragdalion / Kantor",
    company_eval_subtitle: "Penilaian klien terhadap kinerja kantor, hal yang perlu diperhatikan, dan saran pengembangan.",
    no_company_evals: "Belum ada evaluasi kantor yang terkirim.",
    filter_all: "Semua",
    filter_sales: "Sales",
    filter_technical: "Teknis",
    ratings_count: "penilaian",
    projects_count: "proyek",
    rated_count: "dinilai",
    score_waiting: "Menunggu",
    admin_footnote: "Tanda nilai rendah di bawah 3.0 · Anggota tim dapat berada di beberapa proyek — buka baris untuk melihat detail.",

    // Feature 1: Customer & PINs
    add_customer: "+ Tambah Customer & PIN",
    customer_col: "Customer",
    project_col: "Proyek",
    pin_col: "PIN Masuk",
    status_col: "Penilaian",
    deadline_col: "Batas Waktu",
    team_assigned_col: "Tim Ditugaskan",
    copy_pin: "Salin PIN",
    toast_pin_copied: "PIN berhasil disalin ke clipboard!",
    modal_add_customer_title: "Tambah Customer & PIN Baru",
    modal_add_customer_desc: "Masukkan detail customer dan proyek. PIN masuk yang aman akan dibuat secara otomatis untuk mereka.",
    input_customer_name: "Nama Customer / Perusahaan",
    placeholder_customer_name: "contoh: PT Telekomunikasi Indonesia",
    input_project_name: "Nama Proyek",
    placeholder_project_name: "contoh: Migrasi Cloud Sistem Inti",
    input_duration_days: "Masa Berlaku Feedback (Hari)",
    auto_pin_label: "PIN Masuk Otomatis",
    regenerate_pin: "Acak ulang",
    assign_team_label: "Tugaskan Anggota Tim (Sales & Teknis)",
    btn_create_customer: "Buat Customer & PIN",
    toast_customer_created: "Customer berhasil dibuat dengan PIN:",
    no_team_assigned: "Belum ada anggota tim yang ditugaskan",
    customer_card_hint: "Berikan 6-digit PIN ini kepada customer untuk langsung masuk di halaman utama.",

    // Feature 2: Team Members
    add_team_member: "+ Tambah Anggota Tim",
    modal_add_user_title: "Tambah Anggota Tim Baru",
    modal_add_user_desc: "Tambah anggota tim sales atau teknis dan tentukan proyek yang mereka tangani.",
    input_user_name: "Nama Lengkap",
    placeholder_user_name: "contoh: Hendro Kusumo",
    input_user_title: "Jabatan",
    placeholder_user_title: "contoh: Senior Solution Architect",
    input_user_role: "Bagian / Divisi",
    role_sales_desc: "Sales, Account Executive, Presales",
    role_tech_desc: "Engineer, Architect, Developer, Support",
    assign_projects_label: "Tugaskan ke Proyek",
    btn_create_user: "Simpan Anggota Tim",
    toast_user_created: "Anggota tim berhasil ditambahkan!",
    assigned_projects: "Proyek Ditugaskan",
    no_projects_assigned: "Belum ditugaskan ke proyek manapun",
    no_customers_found: "Belum ada customer yang dibuat",
    no_members_found: "Belum ada anggota tim",
    delete_confirm: "Apakah Anda yakin ingin menghapus data ini?",

    // Security & Supabase
    admin_auth_title: "Autentikasi Keamanan Administrator",
    admin_auth_desc: "Masukkan passcode keamanan administrator untuk mengelola anggota tim, customer, dan melihat laporan.",
    admin_passcode_label: "Passcode Keamanan Admin",
    admin_passcode_placeholder: "Masukkan passcode administrator",
    admin_login_btn: "Buka Akses Admin →",
    admin_logout_btn: "Kunci / Keluar Admin",
    admin_passcode_invalid: "Passcode admin tidak valid.",
    admin_locked_message: "Akses admin terkunci sementara karena beberapa kali salah passcode. Coba lagi dalam 15 menit.",
    attempts_remaining: (left: number) => `Sisa ${left} percobaan sebelum sistem terkunci`,
    supabase_sync_success: "Database tersinkronisasi dengan Supabase cloud.",
    db_status_title: "Status Database",
    db_clean_active: "Database Bersih Aktif (Tanpa Data Dummy)",
    no_projects_yet: "Belum ada proyek customer. Klik '+ Tambah Customer & PIN' di atas untuk membuat proyek perdana Anda.",
    no_team_yet: "Belum ada anggota tim. Klik '+ Tambah Anggota Tim' di atas untuk menambahkan personil sales atau teknis.",

    // Scale
    scale: ["Sangat tidak puas", "Tidak puas", "Netral", "Puas", "Sangat puas"],

    // Questions
    questions: {
      sales: [
        "Kecepatan respons terhadap permintaan",
        "Kejelasan proposal dan penawaran harga",
        "Transparansi perubahan harga dan cakupan proyek",
        "Komunikasi dan hubungan kerja",
        "Kepuasan secara keseluruhan",
      ],
      technical: [
        "Kualitas hasil pekerjaan yang diberikan",
        "Kepatuhan terhadap jadwal",
        "Kompetensi teknis",
        "Penanganan kendala dan dukungan teknis",
        "Komunikasi perkembangan proyek",
        "Kepuasan secara keseluruhan",
      ],
      company: [
        "Kemudahan koordinasi & komunikasi dengan pihak Ragdalion",
        "Kualitas dan keandalan solusi yang diberikan secara keseluruhan",
        "Transparansi, tata kelola, dan komitmen terhadap kesepakatan",
        "Profesionalisme dan budaya kerja sama tim kantor",
        "Kepuasan secara menyeluruh bermitra dengan Ragdalion",
      ],
    },
  },
};

const LANG_KEY = "pictrack-lang";
let currentLang: Language = "en";
let initialized = false;
const listeners = new Set<() => void>();

function initLang() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const saved = localStorage.getItem(LANG_KEY) as Language | null;
    if (saved === "en" || saved === "id") {
      currentLang = saved;
    }
  } catch {}
}

export function setLanguage(lang: Language) {
  if (currentLang === lang) return;
  currentLang = lang;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {}
  }
  listeners.forEach((listener) => listener());
}

export function getLanguage(): Language {
  initLang();
  return currentLang;
}

export function useLanguage() {
  const lang = useSyncExternalStore(
    (cb) => {
      initLang();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      initLang();
      return currentLang;
    },
    () => "en" as Language,
  );

  return {
    lang,
    setLang: setLanguage,
    t: translations[lang],
  };
}
