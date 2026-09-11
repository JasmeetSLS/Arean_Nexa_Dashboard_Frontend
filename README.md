1. curl -X GET "http://localhost:4000/api/dashboard/summary?date=2026-09-10&zone=North&region=North&trainerId=1&role=Sales&agency=Agency%20A&dealerCode=D100"


{
  "success": true,
  "generatedAt": "2026-09-10T12:52:00.000Z",

  "todayLiveData": {
    "scheduled": 184,
    "attempted": {
      "total": 150,
      "inProgress": 24,
      "completed": 126
    },
    "absentees": {
      "count": 34,
      "percentage": 18.5
    },
    "delayed": {
      "count": 17,
      "followUps": 9
    },
    "passRate": {
      "percentage": 83,
      "deltaPoints": 4
    },
    "avgTime": {
      "seconds": 1223,
      "display": "20m 23s"
    },
    "activeTrainers": {
      "total": 10,
      "ready": 6,
      "occupied": 4
    }
  },

  "regionWiseSummary": {
    "selectedZone": "North",
    "regions": [
      {
        "name": "NORTH-1",
        "completed": 72,
        "passPercentage": 86,
        "avgTime": { "seconds": 1140, "display": "19m" },
        "colorKey": "purple"
      },
      {
        "name": "NORTH-2",
        "completed": 68,
        "passPercentage": 82,
        "avgTime": { "seconds": 1260, "display": "21m" },
        "colorKey": "sky"
      },
      {
        "name": "NORTH-3",
        "completed": 61,
        "passPercentage": 78,
        "avgTime": { "seconds": 1440, "display": "24m" },
        "colorKey": "emerald"
      },
      {
        "name": "NORTH-4",
        "completed": 54,
        "passPercentage": 74,
        "avgTime": { "seconds": 1620, "display": "27m" },
        "colorKey": "orange"
      }
    ]
  },

  "trainersSummary": [
    {
      "trainerId": 1,
      "name": "Pooja Bora",
      "photoUrl": "/trainers/1.jpeg",
      "availability": "available",
      "assigned": 9,
      "completed": 5,
      "passPercentage": 88,
      "avgTime": { "seconds": 1062, "display": "17m 42s" }
    },
    {
      "trainerId": 2,
      "name": "Meharban singh Bhatia",
      "photoUrl": "/trainers/2.jpeg",
      "availability": "available",
      "assigned": 9,
      "completed": 5,
      "passPercentage": 85,
      "avgTime": { "seconds": 1146, "display": "19m 06s" }
    },
    {
      "trainerId": 3,
      "name": "Imtiyaz syed",
      "photoUrl": "/trainers/3.jpeg",
      "availability": "available",
      "assigned": 9,
      "completed": 4,
      "passPercentage": 81,
      "avgTime": { "seconds": 1211, "display": "20m 11s" }
    }
  ],

  "contestTotals": {
    "scheduled": 1248,
    "attempted": 979,
    "inProgress": 137,
    "completed": 842,
    "absentees": 269,
    "absenteePercentage": 21.6,
    "delayed": 57,
    "delayedPercentage": 4.6,
    "resets": 23,
    "resetPercentage": 1.8,
    "overallPassPercentage": 79,
    "overallGoal": 80,
    "overallAvgTime": { "seconds": 1223, "display": "20m 23s" }
  }
}


curl -X GET "http://localhost:4000/api/dashboard/grid?page=1&limit=5&searchTrainer=pooja&searchParticipant=ayush&zone=North&region=North&agency=Agency%20A&dealerCode=D100&role=Sales"

{
  "success": true,
  "generatedAt": "2026-09-10T12:52:00.000Z",

  "pagination": {
    "page": 1,
    "limit": 5,
    "totalTrainers": 10,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },

  "searchApplied": {
    "trainer": "pooja",
    "participant": "ayush"
  },

  "trainers": [
    {
      "trainerId": 1,
      "name": "Pooja Bora",
      "photoUrl": "/trainers/1.jpeg",
      "availability": "available",
      "stats": {
        "assigned": 9,
        "completed": 5,
        "passPercentage": 88,
        "avgTime": { "seconds": 1062, "display": "17m 42s" }
      },
      "matchesSearch": true
    },
    {
      "trainerId": 2,
      "name": "Meharban singh Bhatia",
      "photoUrl": "/trainers/2.jpeg",
      "availability": "available",
      "stats": {
        "assigned": 9,
        "completed": 5,
        "passPercentage": 85,
        "avgTime": { "seconds": 1146, "display": "19m 06s" }
      },
      "matchesSearch": false
    },
    {
      "trainerId": 3,
      "name": "Imtiyaz syed",
      "photoUrl": "/trainers/3.jpeg",
      "availability": "available",
      "stats": {
        "assigned": 9,
        "completed": 4,
        "passPercentage": 81,
        "avgTime": { "seconds": 1211, "display": "20m 11s" }
      },
      "matchesSearch": false
    },
    {
      "trainerId": 4,
      "name": "Mihir Zaveri",
      "photoUrl": "/trainers/4.jpeg",
      "availability": "available",
      "stats": {
        "assigned": 9,
        "completed": 4,
        "passPercentage": 76,
        "avgTime": { "seconds": 1398, "display": "23m 18s" }
      },
      "matchesSearch": false
    },
    {
      "trainerId": 5,
      "name": "Virendar hada",
      "photoUrl": "/trainers/5.jpeg",
      "availability": "available",
      "stats": {
        "assigned": 9,
        "completed": 3,
        "passPercentage": 74,
        "avgTime": { "seconds": 1315, "display": "21m 55s" }
      },
      "matchesSearch": false
    }
  ],

  "timeSlots": [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM"
  ],

  "grid": [
    {
      "timeSlot": "09:00 AM",
      "cells": [
        {
          "trainerId": 1,
          "participant": {
            "id": "1001",
            "empId": "MS100",
            "displayName": "AYUSH RAJ",
            "role": "Sales",
            "status": "completed",
            "passFail": "Pass",
            "elapsedTime": { "seconds": 300, "display": "05:00" }
          },
          "matchesSearch": true
        },
        {
          "trainerId": 2,
          "participant": {
            "id": "1002",
            "empId": "MS101",
            "displayName": "AYUSH YADAV",
            "role": "Service",
            "status": "completed",
            "passFail": "Pass",
            "elapsedTime": { "seconds": 240, "display": "04:00" }
          },
          "matchesSearch": true
        },
        {
          "trainerId": 3,
          "participant": {
            "id": "1003",
            "empId": "MS102",
            "displayName": "AYYUB KHAN",
            "role": "Finance",
            "status": "in-progress",
            "passFail": null,
            "elapsedTime": { "seconds": 120, "display": "02:00" }
          },
          "matchesSearch": false
        },
        {
          "trainerId": 4,
          "participant": {
            "id": "1004",
            "empId": "MS103",
            "displayName": "AZHAR KALIM KHAN",
            "role": "CRM",
            "status": "completed",
            "passFail": "Pass",
            "elapsedTime": { "seconds": 180, "display": "03:00" }
          },
          "matchesSearch": false
        },
        {
          "trainerId": 5,
          "participant": {
            "id": "1005",
            "empId": "MS104",
            "displayName": "B CHANDRA SEKHAR",
            "role": "Parts",
            "status": "in-progress",
            "passFail": null,
            "elapsedTime": { "seconds": 60, "display": "01:00" }
          },
          "matchesSearch": false
        }
      ]
    },
    {
      "timeSlot": "10:00 AM",
      "cells": [ /* same structure */ ]
    }
    /* ... up to "05:00 PM" */
  ]
}