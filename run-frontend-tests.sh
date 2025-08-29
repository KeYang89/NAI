#!/bin/bash
# Frontend Test Runner

cd frontend
npm test -- --watchAll=false --coverage
echo "Frontend test coverage report generated in frontend/coverage/"

