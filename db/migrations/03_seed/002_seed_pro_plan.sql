-- Insert Pro plan
INSERT INTO public.plans (plan_name, plan_description, plan_price, is_default, is_active)
VALUES ('Pro', 'Premium plan with unlimited AI chatbot, advanced analytics, custom meal plans, and priority support', 39.99, false, true)
ON CONFLICT DO NOTHING;

