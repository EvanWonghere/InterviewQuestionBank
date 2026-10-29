-- Reveal one permitted question without submitting an answer or changing learning progress.
create or replace function public.reveal_question(p_question_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_question public.questions%rowtype;
  v_solution jsonb;
  v_result jsonb;
begin
  select * into v_question from public.questions where id = p_question_id;
  if not found then raise exception 'question not found'; end if;
  if not (v_question.status = 'published' and v_question.visibility = 'public')
     and not private.is_app_admin() then
    raise exception 'question not available';
  end if;

  select solution into v_solution from public.question_solutions where question_id = p_question_id;
  v_solution := coalesce(v_solution, '{}'::jsonb);
  v_result := jsonb_build_object(
    'referenceAnswerMd', coalesce(v_solution->>'referenceAnswerMd', ''),
    'explanationMd', coalesce(v_solution->>'explanationMd', ''),
    'rubricMd', coalesce(v_solution->>'rubricMd', '')
  );
  if v_question.type in ('single_choice', 'multiple_choice') then
    v_result := v_result || jsonb_build_object('correctOptionIds', coalesce(v_solution->'correctOptionIds', '[]'::jsonb));
  elsif v_question.type = 'fill_blank' then
    v_result := v_result || jsonb_build_object('acceptedAnswers', coalesce(v_solution->'acceptedAnswers', '{}'::jsonb));
  end if;
  return v_result;
end;
$$;

revoke execute on function public.reveal_question(uuid) from public;
grant execute on function public.reveal_question(uuid) to anon, authenticated;
