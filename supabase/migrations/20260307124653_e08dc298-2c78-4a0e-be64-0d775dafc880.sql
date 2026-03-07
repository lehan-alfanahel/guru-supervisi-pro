
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System triggers can insert notifications
CREATE POLICY "Allow insert for notification triggers"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify teacher on new supervision
CREATE OR REPLACE FUNCTION public.notify_teacher_on_supervision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT ta.user_id INTO v_user_id
  FROM public.teacher_accounts ta
  WHERE ta.teacher_id = NEW.teacher_id
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      v_user_id,
      'supervision',
      'Supervisi Baru',
      'Kepala sekolah telah melakukan supervisi pada ' || TO_CHAR(NEW.supervision_date, 'DD Mon YYYY'),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_on_supervision
  AFTER INSERT ON public.supervisions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_teacher_on_supervision();

-- Trigger: notify teacher on new coaching
CREATE OR REPLACE FUNCTION public.notify_teacher_on_coaching()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT ta.user_id INTO v_user_id
  FROM public.teacher_accounts ta
  WHERE ta.teacher_id = NEW.teacher_id
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      v_user_id,
      'coaching',
      'Catatan Coaching Baru',
      'Ada catatan coaching baru dari kepala sekolah: ' || NEW.topic,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_on_coaching
  AFTER INSERT ON public.coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_teacher_on_coaching();
