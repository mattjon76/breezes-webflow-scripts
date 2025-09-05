(function() {
  // API Configuration
  const API_BASE = 'https://mybreezes.bubbleapps.io/version-test/api/1.1/wf';
  const API_TOKEN = 'brz_prod_2024_sK9mN2pQ8xL5vR7tY3wA';

  // Current member data
  let currentEmail = '';
  
  // API call helper
  async function apiCall(endpoint, data) {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, api_token: API_TOKEN })
    });
    const text = await response.text();
    if (!response.ok) throw new Error(text);
    return text ? JSON.parse(text) : {};
  }

  // Initialize on page load
  function init() {
    const verified = localStorage.getItem('memberVerified') === 'true';
    const expiry = Number(localStorage.getItem('verificationExpiry') || '0');
    const stillValid = verified && Date.now() < expiry;
    
    if (stillValid) {
      const name = localStorage.getItem('memberName') || 'Member';
      const id = localStorage.getItem('memberID') || 'BZ******';
      const level = localStorage.getItem('memberLevel') || '';
      showMemberStatus(name, id, level);
    } else {
      showLoginLink();
    }
  }
  
  // Show login link
  function showLoginLink() {
    const loginLink = document.getElementById('loginLink');
    const memberStatusNav = document.getElementById('memberStatusNav');
    if (loginLink) loginLink.style.display = 'inline-block';
    if (memberStatusNav) memberStatusNav.classList.remove('active');
  }
  
  // Show member status
  function showMemberStatus(name, memberId, memberLevel) {
    const loginLink = document.getElementById('loginLink');
    const memberStatusNav = document.getElementById('memberStatusNav');
    const memberNameNav = document.getElementById('memberNameNav');
    const memberIdNav = document.getElementById('memberIdNav');
    const memberLevelNav = document.getElementById('memberLevelNav');

    if (loginLink) loginLink.style.display = 'none';
    if (memberNameNav) memberNameNav.textContent = `Hi, ${name}`;
    if (memberIdNav) memberIdNav.textContent = memberId;
    if (memberLevelNav) memberLevelNav.textContent = `(${memberLevel})`;
    if (memberStatusNav) memberStatusNav.classList.add('active');
  }
   
  // Clear member session
  function clearSession() {
    localStorage.removeItem('memberEmail');
    localStorage.removeItem('memberVerified');
    localStorage.removeItem('verificationExpiry');
    localStorage.removeItem('memberName');
    localStorage.removeItem('memberID');
    localStorage.removeItem('memberLevel');
    currentEmail = '';
    showLoginLink();
  }
  
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize display
    init();
    
    // Login link click
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('emailModal').classList.add('active');
      });
    }
    
    // Not you link click
    const notYouNav = document.getElementById('notYouNav');
    if (notYouNav) {
      notYouNav.addEventListener('click', (e) => {
        e.preventDefault();
        clearSession();
      });
    }
    
    // Email submission
    const emailSubmit = document.getElementById('emailSubmit');
    if (emailSubmit) {
      emailSubmit.addEventListener('click', async () => {
        const emailInput = document.getElementById('emailInput');
        const email = emailInput.value.trim().toLowerCase();
        const emailError = document.getElementById('emailError');
        
        if (!email || !email.includes('@')) {
          emailError.classList.add('active');
          return;
        }
        
        emailSubmit.disabled = true;
        currentEmail = email;
        
        try {
          const token = await grecaptcha.execute('6Ld6-LsrAAAAAAKc4dLwewx3qdvsf2OnLParkftM', { action: 'submit' });
          
          const result = await apiCall('members-lookup', { 
            email, 
            recaptchaToken: token 
          });
          const r = result?.response || {};
          const isMember = r.isMember === 'yes' || r.isMember === true || r.isMember === 'true';

          if (isMember) {
            // OTP already sent by members-lookup
            document.getElementById('emailModal').classList.remove('active');
            document.getElementById('otpEmail').textContent = email;
            document.getElementById('otpModal').classList.add('active');
          } else {
            // New member → registration modal
            document.getElementById('emailModal').classList.remove('active');
            document.getElementById('regModal').classList.add('active');
          }
        } catch (err) {
          console.error('Members lookup error:', err);
          emailError.textContent = 'Something went wrong. Please try again.';
          emailError.classList.add('active');
        } finally {
          emailSubmit.disabled = false;
        }
      });
    }
    
    // OTP verification
    const otpSubmit = document.getElementById('otpSubmit');
    if (otpSubmit) {
      otpSubmit.addEventListener('click', async () => {
        const code = document.getElementById('otpInput').value.trim();
        const otpError = document.getElementById('otpError');
        
        // Clear any stale error
        otpError.textContent = '';
        otpError.classList.remove('active');
        
        if (code.length !== 6) {
          otpError.textContent = 'Please enter a 6-digit code';
          otpError.classList.add('active');
          return;
        }
        
        otpSubmit.disabled = true;
        
        try {
          const result = await apiCall('verify-otp', {
            email: currentEmail,
            otpCode: code
          });

          const r = result?.response || {};
          const verified = (
            (r.verified === 'true' || r.verified === true || r.verified === 'yes') &&
            (r.ok === 'yes' || r.ok === true)
          );
        
          if (verified) {
            // Get member data directly from Bubble response
            const name = r.firstName;
            const id = r.memberID;
            const level = r.memberLevel;

            // Persist data
            localStorage.setItem('memberEmail', currentEmail.toLowerCase());
            localStorage.setItem('memberVerified', 'true');
            localStorage.setItem('verificationExpiry', String(Date.now() + 7*24*60*60*1000));
            localStorage.setItem('memberName', name);
            localStorage.setItem('memberID', id);
            localStorage.setItem('memberLevel', level);
            
            // Clean up and switch UI
            otpError.classList.remove('active');
            otpError.textContent = '';
            document.getElementById('otpModal').classList.remove('active');
            showMemberStatus(name, id, level);
          } else {
            otpError.textContent = 'Invalid code. Please try again.';
            otpError.classList.add('active');
          }
        } catch (error) {
          console.error('OTP Error:', error);
          otpError.textContent = 'Verification failed. Please try again.';
          otpError.classList.add('active');
        } finally {
          otpSubmit.disabled = false;
        }
      });
    }
    
    // Resend OTP
    const otpResend = document.getElementById('otpResend');
    if (otpResend) {
      otpResend.addEventListener('click', async () => {
        otpResend.style.pointerEvents = 'none';
        otpResend.textContent = 'Sending...';
        
        try {
          await apiCall('resend-otp', { email: currentEmail });
          otpResend.textContent = 'Code sent!';
          setTimeout(() => { 
            otpResend.textContent = 'Resend code'; 
          }, 3000);
        } catch (error) {
          console.error('Resend error:', error);
          otpResend.textContent = 'Resend code';
        } finally {
          otpResend.style.pointerEvents = 'auto';
        }
      });
    }
    
    // Registration
    const regSubmit = document.getElementById('regSubmit');
    if (regSubmit) {
      regSubmit.addEventListener('click', async () => {
        const firstName = document.getElementById('regFirstName').value.trim();
        const lastName = document.getElementById('regLastName').value.trim();
        const month = document.getElementById('regMonth').value;
        const day = document.getElementById('regDay').value;
        
        if (!firstName || !lastName || !month || !day) {
          const regError = document.getElementById('regError');
          if (regError) {
            regError.textContent = 'Please fill in all fields';
            regError.classList.add('active');
          }
          return;
        }
        
        regSubmit.disabled = true;
        
        try {
          await apiCall('register-member', {
            email: currentEmail,
            firstName,
            lastName,
            dobMonth: parseInt(month, 10),
            dobDay: parseInt(day, 10)
          });
          
          // Send OTP after registration
          await apiCall('resend-otp', { email: currentEmail });
          
          document.getElementById('regModal').classList.remove('active');
          document.getElementById('otpEmail').textContent = currentEmail;
          document.getElementById('otpModal').classList.add('active');
        } catch (error) {
          console.error('Registration error:', error);
          alert('Registration failed. Please try again.');
        } finally {
          regSubmit.disabled = false;
        }
      });
    }
    
    // Cancel buttons
    const emailCancel = document.getElementById('emailCancel');
    if (emailCancel) {
      emailCancel.addEventListener('click', () => {
        document.getElementById('emailModal').classList.remove('active');
      });
    }
    
    const otpCancel = document.getElementById('otpCancel');
    if (otpCancel) {
      otpCancel.addEventListener('click', () => {
        document.getElementById('otpModal').classList.remove('active');
      });
    }
    
    const regCancel = document.getElementById('regCancel');
    if (regCancel) {
      regCancel.addEventListener('click', () => {
        document.getElementById('regModal').classList.remove('active');
      });
    }
    
    // Close modals on backdrop click
    document.querySelectorAll('.auth-modal').forEach(modal => {
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          this.classList.remove('active');
        }
      });
    });
  });

  // Auto-hide regError when user types or changes fields
  document.addEventListener('DOMContentLoaded', () => {
    const regError = document.getElementById('regError');
    ['regFirstName','regLastName','regMonth','regDay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          if (regError) regError.classList.remove('active');
        });
        el.addEventListener('change', () => {
          if (regError) regError.classList.remove('active');
        });
      }
    });
  });

  // Populate day dropdown when month changes
  document.addEventListener('DOMContentLoaded', () => {
    const regMonth = document.getElementById('regMonth');
    const regDay = document.getElementById('regDay');
    
    function populateDays(month) {
      const daysInMonth = {1:31,2:29,3:31,4:30,5:31,6:30,7:31,8:31,9:30,10:31,11:30,12:31};
      if (regDay) {
        regDay.innerHTML = '<option value="">Day</option>';
        const days = daysInMonth[month] || 31;
        for (let i = 1; i <= days; i++) {
          const opt = document.createElement('option');
          opt.value = i;
          opt.textContent = i;
          regDay.appendChild(opt);
        }
      }
    }
    
    // Default load with 31 days
    populateDays(1);
    
    if (regMonth) {
      regMonth.addEventListener('change', () => {
        populateDays(parseInt(regMonth.value, 10));
      });
    }
  });
})();
