import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

const SignupSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Required'),
});

const Signup: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      const response = await fetch("http://localhost:8000/api/tableau/register_user/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        navigate('/login'); // Navigate to login on successful signup
      } else {
        setError(data.error || "Registration failed");
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
          <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">Sign Up</h2>
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}
          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirm_password: '',
            }}
            validationSchema={SignupSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <Field name="name" className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Name" />
                  {errors.name && touched.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                </div>
                <div>
                  <Field name="email" type="email" className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Email" />
                  {errors.email && touched.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                </div>
                <div>
                  <Field name="password" type="password" className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Password" />
                  {errors.password && touched.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
                </div>
                <div>
                  <Field name="confirm_password" type="password" className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Confirm Password" />
                  {errors.confirm_password && touched.confirm_password && <div className="text-red-500 text-sm mt-1">{errors.confirm_password}</div>}
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-full hover:bg-indigo-700 transition duration-300" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                </button>
              </Form>
            )}
          </Formik>
          <p className="mt-4 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
