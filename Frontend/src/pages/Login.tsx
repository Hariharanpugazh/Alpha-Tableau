import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
});

const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      const response = await fetch("http://localhost:8000/api/tableau/login_user/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include", // Ensure cookies are included
    });
  
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        navigate(`/dashboard/${data.user_id}`); // Redirect to user-specific dashboard
      } else {
        setError(data.error || "Login failed");
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
          <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">Login</h2>
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}
          <Formik
            initialValues={{
              email: '',
              password: '',
            }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <Field name="email" type="email" className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Email" />
                  {errors.email && touched.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                </div>
                <div>
                  <Field name="password" type="password" className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Password" />
                  {errors.password && touched.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
                </div>
                <div className="flex justify-end">
                  <Link to="/forgot_password" className="text-sm text-indigo-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-full hover:bg-indigo-700 transition duration-300" disabled={isSubmitting}>
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
              </Form>
            )}
          </Formik>
          <p className="mt-4 text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;