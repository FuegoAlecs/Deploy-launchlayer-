# Supabase Setup Guide

To ensure the Launchlets project functions correctly with your Supabase backend, follow these steps:

## 1. Create Tables
Run the SQL migration found in `supabase/migrations/20240522_echo_tables.sql` in your Supabase SQL Editor. This will create the necessary tables for the Echo AI feature:
- `echo_interactions`
- `user_echo_limits`

## 2. Environment Variables
You need to set the following environment variables in your deployment platform (e.g., Vercel) or your local `.env` file:

- `VITE_SUPABASE_URL`: Your Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.

## 3. Edge Functions
The project relies on a Supabase Edge Function named `ide-debug-contract` for the AI features.
- Ensure this function is deployed to your Supabase project.
- If you do not have the source code for this function, the AI chat features (`useEcho`) will not work.
