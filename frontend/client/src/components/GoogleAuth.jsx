import PropTypes from 'prop-types';

const GoogleAuth = ({ mode }) => {
  const handleGoogleClick = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google?mode=${mode}`;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-100 font-medium shadow-sm"
    >
      <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5 mr-2" />
      Continue with Google
    </button>
  );
};

GoogleAuth.propTypes = {
  mode: PropTypes.oneOf(['login', 'register'])
};

export default GoogleAuth; 