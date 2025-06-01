
import React, { useState } from 'react';
import { User } from '../types';
import { APP_NAME } from '../constants';
import Button from './Button';

interface LoginPageProps {
  onLogin: (user: User) => void;
  allUsers: User[]; // Use the centrally managed allUsers list
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, allUsers }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedUserId) {
      setError('Please select a user to sign in.');
      return;
    }
    const user = allUsers.find(u => u.id === selectedUserId);
    if (user) {
      onLogin(user);
    } else {
      setError('Selected user not found. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-600">{APP_NAME}</h1>
          <p className="text-gray-600 mt-2">Volunteer Scheduling</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700">
              Select User Account
            </label>
            <select
              id="userSelect"
              name="userSelect"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="" disabled>-- Select a User --</option>
              {allUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.isAdmin ? '(Admin)' : ''}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

          <div>
            <Button type="submit" className="w-full" variant="primary" size="lg">
              Sign In
            </Button>
          </div>
           <div className="text-xs text-gray-500 text-center">
              <p>Select an account from the dropdown to log in.</p>
           </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;