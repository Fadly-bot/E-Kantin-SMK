import React, { useState } from 'react';
import { motion } from 'https://esm.sh/framer-motion@11.11.0';
import { User, Lock, ArrowLeft, Loader2, Mail, GraduationCap, Eye, EyeOff } from 'https://esm.sh/lucide-react@0.446.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
// Import modul SEO Helmet Dinamis
import { Helmet } from 'https://esm.sh/react-helmet-async@2.0.1';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface RegisterPageProps {
  role: string;
  onSuccess: (user: any, token: string) => void;
  onBack: () => void;
}

export default function RegisterPage({ role, onSuccess, onBack }: RegisterPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [subRole, setSubRole] = useState('student');
  const [className, setClassName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRules = {
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[._+]/.test(password),
    isValidLength: password.length === 15
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError('Password harus memenuhi semua kriteria pendaftaran.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: sbError } = await supabase
        .from('users')
        .insert([
          { 
            username: username.trim().toLowerCase(), 
            password: password, 
            full_name: fullName.trim(), 
            role: role === 'seller' ? 'seller' : subRole,
            class_name: subRole === 'student' && role !== 'seller' ? className.trim() : null
          }
        ])
        .select()
        .single();

      if (sbError) {
        if (sbError.code === '23505') {
          setError('Username sudah dipakai.');
        } else {
          setError('Gagal: ' + sbError.message);
        }
      } else {
        onSuccess(data, 'session
