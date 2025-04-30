import React from 'react';
import { 
  SignIn, 
  SignUp, 
  SignInButton, 
  SignUpButton 
} from '@clerk/clerk-react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';

type AuthMode = 'sign-in' | 'sign-up';

export default function ClerkAuthComponent() {
  const [mode, setMode] = React.useState<AuthMode>('sign-in');

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="bg-white shadow-lg rounded-xl border-0">
        <CardHeader className="space-y-1 text-center pb-0">
          <CardTitle className="text-2xl font-bold text-teal-700">
            {mode === 'sign-in' ? 'ようこそ' : '新規登録'}
          </CardTitle>
          <p className="text-gray-500 text-sm">
            {mode === 'sign-in' 
              ? '学習をより効果的に管理しましょう' 
              : '数分で簡単にアカウント作成できます'}
          </p>
        </CardHeader>
        
        <CardContent className="pt-5">
          {mode === 'sign-in' ? (
            <SignIn 
              routing="path" 
              path="/sign-in" 
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  card: "shadow-none p-0 border-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  footerAction: "hidden",
                  formButtonPrimary: "bg-teal-600 hover:bg-teal-700 text-white",
                  formFieldInput: "rounded-md border-gray-300",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-500 text-sm",
                  formFieldLabel: "text-gray-700",
                  socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50",
                  socialButtonsBlockButtonText: "text-gray-700 font-medium",
                  identityPreview: "bg-teal-50 border border-teal-100",
                }
              }}
            />
          ) : (
            <SignUp 
              routing="path" 
              path="/sign-up" 
              signInUrl="/sign-in"
              appearance={{
                elements: {
                  card: "shadow-none p-0 border-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  footerAction: "hidden",
                  formButtonPrimary: "bg-teal-600 hover:bg-teal-700 text-white",
                  formFieldInput: "rounded-md border-gray-300",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-500 text-sm",
                  formFieldLabel: "text-gray-700",
                  socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50",
                  socialButtonsBlockButtonText: "text-gray-700 font-medium",
                }
              }}
            />
          )}
        </CardContent>
        
        <CardFooter className="border-t pt-5 flex justify-center">
          {mode === 'sign-in' ? (
            <p className="text-sm text-gray-600">
              アカウントをお持ちでないですか？{' '}
              <button
                onClick={() => setMode('sign-up')}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                新規登録
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              すでにアカウントをお持ちですか？{' '}
              <button
                onClick={() => setMode('sign-in')}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                ログイン
              </button>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 