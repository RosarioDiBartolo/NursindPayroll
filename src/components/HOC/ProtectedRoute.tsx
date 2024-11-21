import React, { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config';

interface Props {
  Comp: React.ComponentType;
}

function ProtectedRoute({ Comp }: Props) {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the login page if the user is not authenticated
    if (loading === false && user === null) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    // You might want to add a loading spinner or message here
    return null;
  }

  return <Comp />;
}

export default ProtectedRoute;
