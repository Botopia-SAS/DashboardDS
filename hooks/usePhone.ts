import { useState, useEffect } from 'react';
import { IPhone } from '@/lib/models/Phone';

export const usePhone = () => {
  const [phone, setPhone] = useState<IPhone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhone = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/phones');
      const data = await response.json();
      
      if (data.success && data.phones.length > 0) {
        setPhone(data.phones[0]); // Get the first phone (main phone)
      } else {
        setPhone(null);
      }
    } catch (err) {
      setError('Failed to fetch phone number');
      console.error('Error fetching phone:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePhone = async (phoneNumber: string, key: string = 'main') => {
    try {
      setError(null);
      
      if (phone && phone._id) {
        // Update existing phone
        const response = await fetch(`/api/phones/${phone._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber, key }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setPhone(data.phone);
          return { success: true, phone: data.phone };
        } else {
          setError(data.error || 'Failed to update phone');
          return { success: false, error: data.error };
        }
      } else {
        // Try to find existing phone by key first
        try {
          const findResponse = await fetch('/api/phones');
          const findData = await findResponse.json();
          
          if (findData.success && findData.phones.length > 0) {
            // Found existing phone, update it
            const existingPhone = findData.phones.find((p: any) => p.key === key) || findData.phones[0];
            const response = await fetch(`/api/phones/${existingPhone._id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ phoneNumber, key }),
            });
            
            const data = await response.json();
            
            if (data.success) {
              setPhone(data.phone);
              return { success: true, phone: data.phone };
            } else {
              setError(data.error || 'Failed to update phone');
              return { success: false, error: data.error };
            }
          }
        } catch (findErr) {
          console.error('Error finding existing phone:', findErr);
        }
        
        // If no existing phone found, create new one
        const response = await fetch('/api/phones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber, key }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setPhone(data.phone);
          return { success: true, phone: data.phone };
        } else {
          setError(data.error || 'Failed to create phone');
          return { success: false, error: data.error };
        }
      }
    } catch (err) {
      const errorMsg = 'Failed to save phone number';
      setError(errorMsg);
      console.error('Error saving phone:', err);
      return { success: false, error: errorMsg };
    }
  };

  useEffect(() => {
    fetchPhone();
  }, []);

  return {
    phone,
    loading,
    error,
    updatePhone,
    refetch: fetchPhone
  };
};
