import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { UserRole } from '../types/auth';

interface UseRoleBasedAccessProps {
  productId?: string;
  context: 'admin' | 'seller';
}

interface AccessState {
  loading: boolean;
  hasAccess: boolean;
  isAdmin: boolean;
  userId?: string;
}

export const useRoleBasedAccess = ({ productId, context }: UseRoleBasedAccessProps) => {
  const navigate = useNavigate();
  const [accessState, setAccessState] = useState<AccessState>({
    loading: true,
    hasAccess: false,
    isAdmin: false
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate(context === 'admin' ? '/admin/login' : '/login');
          return;
        }

        // Check for trusted admin emails first
        const trustedAdmins = ['sokoclick.com@gmail.com', 'pushns24@gmail.com'];
        const isTrustedAdmin = user.email ? trustedAdmins.includes(user.email.toLowerCase()) : false;

        if (isTrustedAdmin) {
          setAccessState({
            loading: false,
            hasAccess: true,
            isAdmin: true,
            userId: user.id
          });
          return;
        }

        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id, email, role')
          .eq('id', user.id)
          .single();

        const isAdmin = adminData?.role === UserRole.SUPER_ADMIN;

        if (context === 'admin' && !isAdmin) {
          console.log('Access denied: User is not an admin', { adminData, userId: user.id });
          navigate('/unauthorized');
          return;
        }

        if (productId) {
          // Check product access
          const { data: product } = await supabase
            .from('products')
            .select('seller_id')
            .eq('id', productId)
            .single();

          const hasAccess = isAdmin || (product && product.seller_id === user.id);
          
          if (!hasAccess) {
            console.log('Access denied: No product access', { 
              isAdmin, 
              productId, 
              sellerId: product?.seller_id, 
              userId: user.id 
            });
            navigate('/unauthorized');
            return;
          }

          setAccessState({
            loading: false,
            hasAccess: true,
            isAdmin,
            userId: user.id
          });
        } else {
          // New product creation - allow for admin or seller context
          const hasAccess = context === 'admin' ? isAdmin : true;
          
          if (!hasAccess) {
            console.log('Access denied: Cannot create product', { context, isAdmin });
            navigate('/unauthorized');
            return;
          }

          setAccessState({
            loading: false,
            hasAccess: true,
            isAdmin,
            userId: user.id
          });
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setAccessState({
          loading: false,
          hasAccess: false,
          isAdmin: false
        });
        navigate('/error');
      }
    };

    checkAccess();
  }, [productId, context, navigate]);

  return accessState;
}; 