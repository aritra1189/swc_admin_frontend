export const usersData = [
  {
    id: "101",
    name: "Arjun Mehta",
    email: "arjun.mehta@example.com",
    mobile: "9876543210",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    class: ["BCA"],
    enrollmentDate: "2024-01-15",
    lastLogin: "2024-08-05T09:30:00",
    plan: {
      name: "Premium",
      startDate: "2024-07-01",
      endDate: "2024-12-31",
      autoRenew: true,
      features: ["All courses", "Certificates", "Priority support"],
    },
    status: "active",
    role: "student",
    address: {
      street: "123 Tech Park",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
    },
    lectureProgress: [
      {
        chapter: "Data Structures",
        course: "Computer Science Fundamentals",
        watchedPercentage: 85,
        lastWatched: "2024-08-04T14:30:00",
        notes: 12,
        bookmarks: 5,
      },
      {
        chapter: "Algorithms",
        course: "Computer Science Fundamentals",
        watchedPercentage: 70,
        lastWatched: "2024-08-03T11:15:00",
        notes: 8,
        bookmarks: 3,
      },
    ],
    testScores: [
      {
        testName: "DSA Midterm",
        score: "90/100",
        attempts: 1,
        date: "2024-07-20",
        timeTaken: "45m",
        percentile: 95,
      },
    ],
    loginActivity: [
      {
        date: "2024-08-02",
        timeSpent: "2h 45m",
        device: "Android Chrome",
        ipAddress: "192.168.1.1",
      },
    ],
    paymentHistory: [
      {
        invoiceId: "INV-1024",
        amount: "120",
        date: "2024-07-25",
        status: "Paid",
        method: "Razorpay",
        transactionId: "txn_123456",
        items: ["Premium Plan Subscription"],
      },
    ],
    certificates: [
      {
        id: "CERT-101",
        course: "Data Structures",
        issueDate: "2024-06-15",
        expiryDate: null,
        verificationUrl: "https://verify.edu/cert/CERT-101",
      },
    ],
    notifications: {
      email: true,
      sms: false,
      push: true,
      frequency: "daily",
    },
    preferences: {
      language: "English",
      theme: "light",
      playbackSpeed: 1.2,
    },
  }]