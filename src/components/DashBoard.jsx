import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/auth/authThunks";
import swcLogo from "../assets/swc.jpg";
import axios from "axios";
import {
  User,
  Users,
  Laptop,
  Home,
  Settings,
  HelpCircle,
  MessageCircle,
  Newspaper,
  QrCode,
  ChevronDown,
  ChevronUp,
  BookOpen,
  PcCase,
  BadgePercent,
  TvMinimalPlay,
  BadgeQuestionMark,
  SquareMinus,
  ShieldCheck,
  OctagonPause,
  BadgeIndianRupee,
  ClipboardMinus,
  LogOut,
  PhoneCall,
  Search,
  BookCopy,
  ListStart,
  SquareKanban,
  CircleArrowOutUpLeft,
  Podcast,
  Database,
  Waypoints,
  Play,
  Headset,
  FileText,
  BookKey
} from "lucide-react";

import FacultyArea from "./FacultyArea";
import AllFaculty from "./AllFaculty";
import UserManagement from "../pages/UserManagement";
import SubjectLectureMaster from "../pages/SubjectLectureMaster";
import { LibraryProvider } from "../context/LibraryContext";
// import DigitalLibrary from "../pages/DigitalLibrary";
// import TestManager from "../pages/TestManager";
import { TestProvider } from "../context/TestContext";
import { QuestionBankProvider } from "../context/QuestionBankContext";
import { QuestionBank } from "../pages/QuestionBank";
import ChapterSyllabusManager from "../pages/ChapterSyllabusManager";
import { SubjectProvider } from "../context/SubjectContext";
import { SyllabusProvider } from "../context/SyllabusContext";
import { CouponProvider } from "../context/CouponContext";
import { usersData } from "../pages/mockUsers";
import CouponManager from "../pages/CouponManager";
import NoticeBoardManager from "../pages/NoticeBoard";
import CourseManager from "../pages/CourseManager";
import StudentPerformanceReports from "../pages/StudentReports";
import AuditLogs from "../pages/AuditLogs";
import PaymentsManager from "../pages/PaymentManager";
import BannerManagementPage from "./Banner";
import FaqManager from "../pages/FaqSection";
import ContactUsAdmin from "../pages/Contact_us";
import AdminFeedback from "../pages/Feedback";
import { API_BASE_URL } from "../config/api";
import NewsManagement from "../pages/NewsManagement";
import NotificationManager from "../pages/NotificationManager";
import ClassesPage from "../pages/Class_management";
import AdminBoardManagement from "../pages/Boards";
import AdminDegreeManagement from "../pages/Degree";
import Grade_management from "../pages/Grade_management";
import Stream_manager from "../pages/Stream_manager";
import University from "../pages/University";
import Semester from "../pages/Semester";
import SubjectMaster from "../pages/Subjects";
import Subject_connection from "../pages/Subject_connection";
import { AuthProvider } from "../context/AuthContext";
import Pages from "../pages/Pages";
import EducationalContentPage from "../pages/Educationalcontent";
// import UnitsofSubjects  from "../pages/UnitsofSubjects";
import AudioLectureManager from "../pages/AudioLecture";
import Study_material from "../pages/Study_material";
import McqTestManager from "../pages/McqTestManager";
import QuestionManager from "../pages/QuestionManager";
import Examtypes from "../pages/Examtypes";
import ExamManagement from "../pages/Examslist";
import Menu_permission from "../pages/Menu_permission";
// ADD THIS IMPORT


const totalCourses = 4;
const totalLectures = 1;

const getStats = (bannerCount, facultyCount, activeStaffCount, inactiveStaffCount, totalUsersCount, activeUsersCount, inactiveUsersCount, totalCoursesCount, totalFeedbackCount, totalNewsCount) => [
  {
    title: "All Users",
    count: totalUsersCount,
    color: "border-red-400 text-red-500",
    icon: <User />,
    path: "/users",
  },
  {
    title: "Active Users",
    count: activeUsersCount,
    color: "border-green-400 text-green-500",
    icon: <Users />,
    path: "/users?status=active",
  },
  {
    title: "Inactive Users",
    count: inactiveUsersCount,
    color: "border-red-400 text-red-500",
    icon: <Users />,
    path: "/users?status=inactive",
  },
  {
    title: "Admin & Staff",
    count: facultyCount,
    color: "border-blue-300 text-blue-500",
    icon: <Users />,
    path: "/faculty/all",
  },
  {
    title: "Active Staff",
    count: activeStaffCount,
    color: "border-green-400 text-green-500",
    icon: <Users />,
    path: "/faculty/all?status=active",
  },
  {
    title: "Inactive Staff",
    count: inactiveStaffCount,
    color: "border-red-400 text-red-500",
    icon: <Users />,
    path: "/faculty/all?status=inactive",
  },
  {
    title: "Total courses",
    count: totalCoursesCount,
    color: "border-yellow-300 text-yellow-500",
    icon: <Home />,
    path: "/courses/show",
  },
  {
    title: "Total Banners",
    count: bannerCount,
    color: "border-emerald-300 text-emerald-500",
    icon: <BookKey />,
    path: "/banners",
  },
  {
    title: "Total lectures",
    count: totalLectures,
    color: "border-purple-300 text-purple-500",
    icon: <User />,
    path: "/lectures",
  },
  {
    title: "Total Feedback",
    count: totalFeedbackCount,
    color: "border-indigo-300 text-indigo-500",
    icon: <ShieldCheck />,
    path: "/feedback",
  },
  {
    title: "Total News",
    count: totalNewsCount,
    color: "border-pink-300 text-pink-500",
    icon: <Newspaper />,
    path: "/news-management",
  },
];

const facultyMenuItems = [
  { label: "All Admin&Staff", path: "/faculty/all" },
  { label: "Add Admin&Staff", path: "/faculty/add" },
];

const courseMenuItems = [
  { label: "All Courses", path: "/courses/show" }
];

const additionalMenuItems = [
  {label: "Pages", path: "/pages", icon: <BookCopy size={18} /> },
  { label: "Levels", path: "/classes", icon: <ListStart size={18} /> },
  { label: "Boards", path: "/boards", icon: <SquareKanban size={18} /> },
  { label: "Degree", path: "/Degree", icon: <CircleArrowOutUpLeft size={18} /> },
  { label: "Grade", path: "/grade-management", icon: <PcCase size={18} /> },
  { label: "Stream", path: "/stream-management", icon: <Podcast size={18} /> },
  { label: "University", path: "/university", icon: <Laptop size={18} /> },
  { label: "Semester", path: "/semester", icon: <Database size={18} /> },
  { label: "Subjects", path: "/subject", icon: <TvMinimalPlay size={18} /> },
  { label: "Subject Connection", path: "/subject-connection", icon: <Waypoints size={18} /> },
  { label: "Video Lectures", path: "/educational-content", icon: <BookOpen size={18} /> },
  { label: "Audio Lectures", path: "/audio-lectures", icon: <Headset size={18} /> },
  { label: "Study Material", path: "/study-material", icon: <FileText size={18} /> },
  { label: "Users", path: "/users", icon: <MessageCircle size={18} /> },
  { label: "Admin & Staff", path: "/faculty", icon: <Users size={18} />, hasDropdown: true },
  {label: "Menu Permission", path: "/menu-permission", icon: <Users size={18} />},
  { label: "Tests", path: "/tests", icon: <Laptop size={18} /> },
  { label: "Add Question", path: "/add-question", icon: <BadgeQuestionMark size={18} /> },
  { label: "Units", path: "/chapter-syllabus", icon: <OctagonPause size={18} /> },
  { label: "Coupons", path: "/coupons", icon: <BadgePercent size={18} /> },
  {label: "Exam Types", path: "/exam-types", icon: <Play size={18} />},
  {label: "Exams", path: "/exams", icon: <Play size={18} />},
  { label: "Notice Board", path: "/notice-board", icon: <SquareMinus size={18} /> },
  { label: "Student Reports", path: "/student-reports", icon: <ClipboardMinus size={18} /> },
  { label: "Audit Logs", path: "/audit-logs", icon: <ShieldCheck size={18} /> },
  { label: "Payments", path: "/payments", icon: <BadgeIndianRupee size={18} /> },
  { label: "Banner Management", path: "/banners", icon: <Newspaper size={18} /> },
  { label: "FAQ Management", path: "/faqs", icon: <HelpCircle size={18} /> },
  { label: "Contact Us", path: "/contact-us", icon: <PhoneCall size={18} /> },
  { label: "Feedback Management", path: "/feedback", icon: <ShieldCheck size={18} /> },
  { label: "News Management", path: "/news-management", icon: <Newspaper size={18} /> },
  { label: "Notification Manager", path: "/notification-manager", icon: <QrCode size={18} /> },
];

export default function DashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [facultyList, setFacultyList] = useState([]);
  const [activeStaffCount, setActiveStaffCount] = useState(0);
  const [inactiveStaffCount, setInactiveStaffCount] = useState(0);
  const [totalBanners, setTotalBanners] = useState(0);
  const [banners, setBanners] = useState([]);
  const [courseList, setCourseList] = useState(() => {
    const stored = localStorage.getItem("courseList");
    return stored ? JSON.parse(stored) : [];
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [inactiveUsersCount, setInactiveUsersCount] = useState(0);
  const [totalCoursesCount, setTotalCoursesCount] = useState(0);
  const [totalFeedbackCount, setTotalFeedbackCount] = useState(0);
  const [totalNewsCount, setTotalNewsCount] = useState(0);

  // Get token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("token") || "";
  };

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const token = getAuthToken();
        
        // Fetch banners
        const bannersRes = await axios.get(`${API_BASE_URL}/banner/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (bannersRes.status === 200 && bannersRes.data) {
          const bannersData = bannersRes.data.data || [];
          const totalCount = bannersRes.data.total || bannersData.length;
          setBanners(bannersData);
          setTotalBanners(totalCount);
        }

        // Fetch active staff
        const activeStaffRes = await axios.get(`${API_BASE_URL}/account/stafflist`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 100,
            offset: 0,
            status: "ACTIVE",
          },
        });
        
        // Fetch inactive staff
        const inactiveStaffRes = await axios.get(`${API_BASE_URL}/account/stafflist`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 100,
            offset: 0,
            status: "DEACTIVE",
          },
        });

        if (activeStaffRes.status === 200 && activeStaffRes.data && inactiveStaffRes.status === 200 && inactiveStaffRes.data) {
          const activeStaffData = activeStaffRes.data.result || [];
          const inactiveStaffData = inactiveStaffRes.data.result || [];
          const allStaff = [...activeStaffData, ...inactiveStaffData];
          
          setFacultyList(allStaff);
          setActiveStaffCount(activeStaffData.length);
          setInactiveStaffCount(inactiveStaffData.length);
        }

        // Fetch active users
        const activeUsersRes = await axios.get(`${API_BASE_URL}/account/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 1,
            offset: 0,
            status: "ACTIVE",
          },
        });
        
        // Fetch inactive users
        const inactiveUsersRes = await axios.get(`${API_BASE_URL}/account/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 1,
            offset: 0,
            status: "DEACTIVE",
          },
        });

        if (activeUsersRes.status === 200 && activeUsersRes.data && inactiveUsersRes.status === 200 && inactiveUsersRes.data) {
          setActiveUsersCount(activeUsersRes.data.total || 0);
          setInactiveUsersCount(inactiveUsersRes.data.total || 0);
          setTotalUsersCount((activeUsersRes.data.total || 0) + (inactiveUsersRes.data.total || 0));
        }

        // Fetch total courses count
        const coursesRes = await axios.get(`${API_BASE_URL}/course/admin`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 10,
            offset: 0,
          },
        });
        if (coursesRes.status === 200 && coursesRes.data) {
          setTotalCoursesCount(coursesRes.data.total || 0);
        }

        // Fetch total feedback count
        const feedbackRes = await axios.get(`${API_BASE_URL}/rating-feedback/list`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 1,
            offset: 0,
            status:true
          },
        });
        if (feedbackRes.status === 200 && feedbackRes.data) {
          setTotalFeedbackCount(feedbackRes.data.total || 0);
        }

        // Fetch total news count
        const newsRes = await axios.get(`${API_BASE_URL}/news/list`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 10,
            offset: 0,
            
          },
        });
        if (newsRes.status === 200 && newsRes.data) {
          setTotalNewsCount(newsRes.data.total || 0);
        }

      } catch (error) {
        console.error("Error fetching stats:", error.message);
        if (error.response && error.response.status === 401) {
          dispatch(logoutUser());
          navigate("/login");
        }
      }
    };

    fetchAllStats();
  }, [dispatch, navigate]);

  useEffect(() => {
    localStorage.setItem("courseList", JSON.stringify(courseList));
  }, [courseList]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    dispatch(logoutUser());
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const filteredMenuItems = useMemo(() => {
    if (!searchTerm) return additionalMenuItems;
    return additionalMenuItems.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="flex h-screen font-sans text-gray-800">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <LogOut className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Confirm Logout</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to logout from the admin panel?
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                onClick={cancelLogout}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-sm font-medium text-white rounded-md hover:bg-red-700 focus:outline-none"
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-68 bg-gradient-to-b from-blue-50 to-white border-r shadow-md flex flex-col">
        <img src={swcLogo} alt="SWC Logo" className="w-36 h-36 mx-auto mt-4 mb-2 rounded-full object-cover"/>
        <div className="px-4 pb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          <nav className="space-y-3 pb-6">
            <SidebarItem icon={<Home size={18} />} label="Home" onClick={() => navigate("/")} />
            
            <SidebarItem icon={<PcCase size={18} />} label="Courses" onClick={() => navigate("/courses/show")} />
            
            {filteredMenuItems.map((item) => (
              <SidebarItem 
                key={item.path} 
                icon={item.icon} 
                label={item.label} 
                onClick={item.hasDropdown ? undefined : () => navigate(item.path)}
                hasDropdown={item.hasDropdown}
              >
                {item.hasDropdown && (
                  <>
                    <DropdownItem label="All Admin & Staff" onClick={() => navigate("/faculty/all")} />
                    <DropdownItem label="Add Admin & Staff" onClick={() => navigate("/faculty/add")} />
                  </>
                )}
              </SidebarItem>
            ))}
            
            {filteredMenuItems.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No menu items found matching your search.
              </div>
            )}
            
            <SidebarItem icon={<HelpCircle size={18} />} label="Support" />
          </nav>
        </div>
        
        {/* Sidebar Footer */}
        <div className="px-5 py-4 border-t border-gray-200 text-sm text-gray-600 bg-white">
          <div className="flex flex-col gap-2">
            <p className="font-semibold">SWC Pvt Ltd.</p>
            <p className="text-xs text-gray-400">cust.webappsoftwares@gmail.com</p>
            <button
              onClick={handleLogout}
              className="mt-3 flex items-center gap-2 text-sm text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        <Routes>
          <Route path="/" element={<OverviewSection 
            totalBanners={totalBanners} 
            facultyCount={facultyList.length} 
            activeStaffCount={activeStaffCount}
            inactiveStaffCount={inactiveStaffCount}
            totalUsersCount={totalUsersCount}
            activeUsersCount={activeUsersCount}
            inactiveUsersCount={inactiveUsersCount}
            totalCoursesCount={totalCoursesCount}
            totalFeedbackCount={totalFeedbackCount}
            totalNewsCount={totalNewsCount}
          />} />
          <Route path="/pages" element={<Pages />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/boards" element={<AdminBoardManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/faculty/all" element={<AllFaculty facultyList={facultyList} setFacultyList={setFacultyList} />} />
          <Route path="/faculty/add" element={<FacultyArea facultyList={facultyList} setFacultyList={setFacultyList} />} />
          {/* UPDATED ROUTE FOR PERMISSIONS */}
          <Route path="/menu-permission/:accountId" element={<Menu_permission />} />
          <Route path="/courses/show" element={<CourseManager courseList={courseList} setCourseList={setCourseList} />} />
          <Route path="/courses/add" element={<PlaceholderPage page="Add Course" />} />
          <Route path="/degree" element={<AdminDegreeManagement />} />
          <Route path="/grade-management" element={<Grade_management />} />
          <Route path="/stream-management" element={<Stream_manager />} />
          <Route path="/educational-content" element={<EducationalContentPage />} />
          <Route path="/audio-lectures" element={<AudioLectureManager />} />
          <Route path="/study-material" element={<Study_material />} />
          <Route path="/university" element={<University />} />
          <Route path="/semester" element={<Semester />} />
          <Route path="/subject" element={<SubjectMaster />} />
          
          
          <Route path="/subject-connection" element={
            <SubjectProvider>
              <Subject_connection />
            </SubjectProvider>
          } />
          <Route path="/subject-lecture" element={
            <TestProvider>
              <QuestionBankProvider>
                <SubjectLectureMaster />
              </QuestionBankProvider>
            </TestProvider>
          } />
          {/* <Route path="/unitsofsubjects" element={<UnitsofSubjects />} /> */}
          {/* <Route path="/library" element={
            <AuthProvider>
              <LibraryProvider>
                <DigitalLibrary user={user} />
              </LibraryProvider>
            </AuthProvider>
          } /> */}
          <Route path="/tests" element={
            <TestProvider>
              <McqTestManager />
            </TestProvider>
          } />
          <Route path="/add-question" element={
            <QuestionBankProvider>
              <QuestionManager/>
            </QuestionBankProvider>
          } />
          <Route path="/chapter-syllabus" element={
            <SubjectProvider>
              <SyllabusProvider>
                <ChapterSyllabusManager />
              </SyllabusProvider>
            </SubjectProvider>
          } />
          <Route path="/notice-board" element={<NoticeBoardManager />} />
          <Route path="/banners" element={<BannerManagementPage />} />
          <Route path="/faqs" element={<FaqManager />} />
          <Route path="/contact-us" element={<ContactUsAdmin />} />
          <Route path="/feedback" element={<AdminFeedback />} />
          <Route path="/news-management" element={
            <AuthProvider>
              <NewsManagement />
            </AuthProvider>} />
          <Route path="/notification-manager" element={
            <AuthProvider>
              <NotificationManager />
            </AuthProvider>} />
          <Route path="/coupons" element={
            <CouponProvider>
              <CouponManager />
            </CouponProvider> 
          } />
          <Route path="/student-reports" element={<StudentPerformanceReports />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/exam-types" element={<Examtypes />}/>
          <Route path="/exams" element={<ExamManagement />} />
          <Route path="/payments" element={<PaymentsManager />} />
          <Route path="*" element={<PlaceholderPage page="404 - Not Found" />} />
        </Routes>
      </main>
    </div>
  );
}

function OverviewSection({ totalBanners, facultyCount, activeStaffCount, inactiveStaffCount, totalUsersCount, activeUsersCount, inactiveUsersCount, totalCoursesCount, totalFeedbackCount, totalNewsCount }) {
  const navigate = useNavigate();
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {getStats(totalBanners, facultyCount, activeStaffCount, inactiveStaffCount, totalUsersCount, activeUsersCount, inactiveUsersCount, totalCoursesCount, totalFeedbackCount, totalNewsCount).map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.path)}
            className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className={`p-3 mr-3 rounded-lg border ${item.color}`}>
              {item.icon}
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-gray-500">{item.title}</p>
              <p className="text-xl font-bold text-gray-800">{item.count}</p>
            </div>
            
            <div className="text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, onClick, hasDropdown = false, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-100 cursor-pointer text-gray-800 transition"
        onClick={() => {
          if (hasDropdown) setOpen(!open);
          if (onClick && !hasDropdown) onClick();
        }}
      >
        <div className="flex items-center gap-3">
          {icon && <span>{icon}</span>}
          <span className="font-medium">{label}</span>
        </div>
        {hasDropdown && (
          <span className="text-gray-500">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        )}
      </div>
      {hasDropdown && open && (
        <div className="ml-4 mt-1 space-y-1 text-sm border-l border-gray-200 pl-3">{children}</div>
      )}
    </div>
  );
}

function DropdownItem({ label, onClick }) {
  return (
    <div
      className="px-2 py-1 rounded-md hover:bg-gray-200 cursor-pointer text-gray-700 transition"
      onClick={onClick}
    >
      {label}
    </div>
  );
}

function PlaceholderPage({ page }) {
  return (
    <div className="text-center text-gray-500 text-lg mt-10">
      <p>{page} Page Under Construction...</p>
    </div>
  );
}