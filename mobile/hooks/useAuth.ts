import { useState } from 'react';
import { MOCK_USER } from '../constants/mockData';
import { User } from '../types';

export function useAuth() {
  const [user] = useState<User>(MOCK_USER);
  const [isAuthenticated] = useState(true);

  return { user, isAuthenticated };
}
