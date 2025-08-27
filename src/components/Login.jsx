import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../store/auth/authThunks';
import { Lock, User, CheckCircle2 } from 'lucide-react';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    loginId: '',
    password: ''
  });
  const [localError, setLocalError] = useState('');
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.from?.pathname || '/');
    }
    
    const params = new URLSearchParams(location.search);
    if (params.get('logout') === 'true') {
      setShowLogoutSuccess(true);
      navigate(location.pathname, { replace: true });
    }
  }, [isAuthenticated, location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!credentials.loginId.trim() || !credentials.password.trim()) {
      setLocalError('Please enter both admin ID and password');
      return;
    }

    const result = await dispatch(loginUser(credentials));
    
    if (result?.success) {
      navigate(location.state?.from?.pathname || '/');
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const closeLogoutSuccess = () => {
    setShowLogoutSuccess(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 relative">
      {showLogoutSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center w-full max-w-sm">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-gray-800">Logged Out Successfully!</h3>
            <p className="text-gray-600 mb-6">You have been securely logged out of the system.</p>
            <button
              onClick={closeLogoutSuccess}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-700">Admin Dashboard</h2>
          <p className="text-gray-500 mt-2">Sign in to your administrator account</p>
        </div>

        {(localError || error) && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 ring-blue-400">
              <User className="text-gray-400 mr-2" size={18} />
              <input
                type="text"
                name="loginId"
                placeholder="Admin ID"
                className="w-full bg-transparent outline-none text-sm"
                value={credentials.loginId}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 ring-blue-400">
              <Lock className="text-gray-400 mr-2" size={18} />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full bg-transparent outline-none text-sm"
                value={credentials.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-70 flex justify-center items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : 'Login'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>For security reasons, please log out when finished</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;