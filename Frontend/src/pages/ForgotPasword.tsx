import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
});

const ForgotPassword: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      const response = await fetch("http://localhost:8000/api/tableau/forgot_password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || "Request failed");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-2xl rounded-3xl p-8">
          <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">Forgot Password</h2>
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}
          {message && <div className="text-green-500 text-center mb-4">{message}</div>}
          <Formik
            initialValues={{ email: '' }}
            validationSchema={ForgotPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <Field
                    name="email"
                    type="email"
                    className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="Email"
                  />
                  {errors.email && touched.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded-full hover:bg-indigo-700 transition duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending email...' : 'Send Reset Link'}
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

export default ForgotPassword;
