import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';

const ResetPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Required'),
  token: Yup.string().required('Required'),
  password: Yup.string().required('Required'),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Required'),
});

const ResetPassword: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/tableau/reset_password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          token: values.token,
          password: values.password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setTimeout(() => {
          navigate('/'); // Navigate to login page after 3 seconds
        }, 3000);
      } else {
        setError(data.error || 'Reset failed');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-2xl rounded-3xl p-8">
          <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">Reset Password</h2>
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}
          {message && <div className="text-green-500 text-center mb-4">{message}</div>}
          <Formik
            initialValues={{ email: '', token: '', password: '', confirm_password: '' }}
            validationSchema={ResetPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <Field
                    name="email"
                    type="email"
                    className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="Enter your email"
                  />
                  {errors.email && touched.email && (
                    <div className="text-red-500 text-sm mt-1">{errors.email}</div>
                  )}
                </div>
                <div>
                  <Field
                    name="token"
                    type="text"
                    className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="Enter your reset token"
                  />
                  {errors.token && touched.token && (
                    <div className="text-red-500 text-sm mt-1">{errors.token}</div>
                  )}
                </div>
                <div>
                  <Field
                    name="password"
                    type="password"
                    className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="New password"
                  />
                  {errors.password && touched.password && (
                    <div className="text-red-500 text-sm mt-1">{errors.password}</div>
                  )}
                </div>
                <div>
                  <Field
                    name="confirm_password"
                    type="password"
                    className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="Confirm new password"
                  />
                  {errors.confirm_password && touched.confirm_password && (
                    <div className="text-red-500 text-sm mt-1">{errors.confirm_password}</div>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded-full hover:bg-indigo-700 transition duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </Form>
            )}
          </Formik>
          <p className="mt-4 text-center text-gray-600">
            Remembered your password?{' '}
            <Link to="/" className="text-indigo-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
