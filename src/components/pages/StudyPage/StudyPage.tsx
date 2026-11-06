import { AlertCircle, Check, Maximize, Minimize, X } from "lucide-react";
import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { STORAGE_KEYS } from "../../../core/config/constants";
import { aiService, getAIErrorMessage } from "../../../core/services/ai";
import { debugLog } from "../../../core/services/ai/debug";
import { getProviderConfig } from "../../../core/services/ai/providers/registry";
import { formatMessage } from "../../../core/services/i18n";
import { createId } from "../../../core/utils/id";
import { useLanguage, useLocalStorage, useMultiProviderSettings } from "../../../hooks";
import { Difficulty, LearningSettings, Question, StudySession } from "../../../types";
import MarkdownRenderer from "../../MarkdownRenderer";
import { stripExplanationLabel } from "../../explanationText";
import { answeredCount, createReviewCopy, DIFFICULTIES, difficultyLabels, findDueReview, isAnswered, nextDifficulty, nextFocusContext, normalizeLearningSettings, sessionScore } from "./learningTechniques";
import { enterQueue, recordReviewResult, takeNextReview } from "./reviewSchedule";

const OPTION_KEYS = ["A", "B", "C", "D"];

export default function StudyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();

  // State management
  const [sessions, setSessions] = useLocalStorage<StudySession[]>(STORAGE_KEYS.SESSIONS, []);
  const [multiProviderSettings] = useMultiProviderSettings();

  // Session state
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string | number>("");
  const [confidence, setConfidence] = useState<number>(3);
  const [showFeedback, setShowFeedback] = useState(false);
  const [elaborativeQuestion, setElaborativeQuestion] = useState("");
  const [elaborativeAnswer, setElaborativeAnswer] = useState("");
  const [selfExplanation, setSelfExplanation] = useState("");
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [explanationFeedbackError, setExplanationFeedbackError] = useState<string | null>(null);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session setup state
  const [isSetupMode, setIsSetupMode] = useState(true);
  const [contexts, setContexts] = useState<string[]>([]);
  const [newContext, setNewContext] = useState("");
  const [instructions, setInstructions] = useState<string[]>([]);
  const [newInstruction, setNewInstruction] = useState("");
  const [questionType, setQuestionType] = useState<"multipleChoice" | "dissertative" | "mixed">("multipleChoice");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [learningSettings, setLearningSettings] = useState<LearningSettings>(() => normalizeLearningSettings());

  // Once a session starts or resumes, its own stored settings drive the study flow
  const sessionSettings = normalizeLearningSettings(currentSession?.learningSettings);
  const levelLabels = difficultyLabels(t);

  // UI state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const questionContainerRef = React.useRef<HTMLDivElement>(null);

  // Get current provider settings
  const currentProviderSettings = multiProviderSettings.providers[multiProviderSettings.currentProvider];
  const currentProviderConfig = getProviderConfig(multiProviderSettings.currentProvider);

  // Check if provider is configured
  const isProviderConfigured = currentProviderConfig.requiresApiKey ? !!currentProviderSettings.apiKey : true;

  // Toggle fullscreen mode for focused studying
  const toggleFullscreen = () => {
    if (questionContainerRef.current) {
      if (!isFullscreen) {
        if (questionContainerRef.current.requestFullscreen) {
          questionContainerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const startNewSession = async () => {
    if (contexts.length === 0) {
      setError(t.aiErrorMissingContext);
      return;
    }

    if (!isProviderConfigured) {
      setError(t.configureProviderFirst);
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const newSession: StudySession = {
        id: createId(),
        contexts: [...contexts],
        instructions: instructions.length > 0 ? [...instructions] : undefined,
        createdAt: new Date().toISOString(),
        questions: [],
        status: "active",
        score: 0,
        totalQuestions: 0,
        questionType,
        learningSettings,
        difficulty,
        currentQuestionIndex: 0,
      };

      setCurrentSession(newSession);
      setSessions((prev) => [...prev, newSession]);
      setIsSetupMode(false);

      await generateNextQuestion(newSession);
    } catch (error) {
      debugLog("Error starting session:", error);
      setError(getAIErrorMessage(error, t));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateNextQuestion = useCallback(async (session: StudySession) => {
    const settings = normalizeLearningSettings(session.learningSettings);
    const reviewPick = session.kind === "review" ? takeNextReview(sessions, session.reviewQueue ?? [], new Date()) : undefined;
    const dueReview = !reviewPick && settings.spacedRepetition ? findDueReview(session.questions) : undefined;

    if (reviewPick && !reviewPick.next) {
      // The queue is empty: a review session never generates new questions
      const finishedSession: StudySession = { ...session, reviewQueue: [] };
      setCurrentSession(finishedSession);
      setSessions((prev) => prev.map((s) => (s.id === session.id ? finishedSession : s)));
      setReviewComplete(true);
      return;
    }

    if (!reviewPick && !dueReview && !isProviderConfigured) {
      setError(t.configureProviderFirst);
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      let question: Question;
      if (reviewPick?.next) {
        // A due question from an earlier session comes back as a reshuffled copy without an API call
        const { original, sourceSessionId } = reviewPick.next;
        question = { ...createReviewCopy(original, [], createId, Math.random), sourceSessionId, explanation: original.explanation };
      } else if (dueReview) {
        // A missed question comes back as a reshuffled copy without an API call
        const priorCopies = session.questions.filter((q) => q.reviewOf === dueReview.id);
        question = { ...createReviewCopy(dueReview, priorCopies, createId, Math.random), explanation: dueReview.explanation };
      } else {
        let questionTypeToGenerate: "multipleChoice" | "dissertative" = "multipleChoice";
        if (session.questionType === "mixed") {
          questionTypeToGenerate = Math.random() > 0.5 ? "multipleChoice" : "dissertative";
        } else if (session.questionType) {
          questionTypeToGenerate = session.questionType;
        }

        const requestedDifficulty = session.difficulty ?? "medium";
        const focusContext = settings.interleaving ? nextFocusContext(session.questions, session.contexts) : undefined;

        const generatedQuestion = await aiService.generateQuestion(
          {
            contexts: session.contexts,
            instructions: session.instructions,
            type: questionTypeToGenerate,
            language,
            difficulty: requestedDifficulty,
            focusContext,
          },
          {
            provider: multiProviderSettings.currentProvider,
            apiKey: currentProviderSettings.apiKey,
            model: currentProviderSettings.model,
            baseUrl: currentProviderSettings.baseUrl,
            customHeaders: currentProviderSettings.customHeaders,
          }
        );

        question = {
          id: createId(),
          question: generatedQuestion.question,
          type: generatedQuestion.type,
          options: generatedQuestion.options,
          correctAnswer: generatedQuestion.correctAnswer,
          correctAnswerText: generatedQuestion.sampleAnswer,
          explanation: generatedQuestion.explanation,
          evaluationCriteria: generatedQuestion.evaluationCriteria,
          attempts: 0,
          difficulty: requestedDifficulty,
          context: focusContext,
        };
      }

      const updatedSession: StudySession = {
        ...session,
        questions: [...session.questions, question],
        currentQuestionIndex: session.questions.length,
        ...(reviewPick ? { reviewQueue: reviewPick.remaining } : {}),
      };

      setCurrentSession(updatedSession);
      setCurrentQuestion(question);
      setSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSession : s)));

      // Reset UI state
      setUserAnswer("");
      setSelectedOption(null);
      setConfidence(3);
      setShowFeedback(false);
      setElaborativeQuestion("");
      setElaborativeAnswer("");
      setSelfExplanation("");
      setExplanationFeedbackError(null);
      setIsAnswerSubmitted(false);
    } catch (error) {
      debugLog("Error generating question:", error);
      setError(getAIErrorMessage(error, t));
    } finally {
      setIsGenerating(false);
    }
  }, [sessions, isProviderConfigured, language, t, multiProviderSettings.currentProvider, currentProviderSettings, setSessions]);

  // Load an existing session once per resume request. `sessions` changes after every
  // answer and question write; re-running the resume logic on those writes would reset
  // local state and could start a duplicate question generation.
  const resumeSessionId: string | undefined = location.state?.sessionId;
  const handledResumeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!resumeSessionId || handledResumeIdRef.current === resumeSessionId) return;

    const existingSession = sessions.find((s) => s.id === resumeSessionId);
    if (!existingSession) return;
    handledResumeIdRef.current = resumeSessionId;
    if (existingSession.status !== "active") return;

    setCurrentSession(existingSession);
    setReviewComplete(false);
    setIsSetupMode(false);

    const resumedQuestion = existingSession.currentQuestionIndex !== undefined ? existingSession.questions[existingSession.currentQuestionIndex] : undefined;
    if (resumedQuestion) {
      setCurrentQuestion(resumedQuestion);
      // An answered question comes back in its feedback state, so it cannot be answered (and graded) twice
      if (isAnswered(resumedQuestion)) {
        setSelectedOption(typeof resumedQuestion.userAnswer === "number" ? resumedQuestion.userAnswer : null);
        setUserAnswer(resumedQuestion.userAnswer ?? "");
        setSelfExplanation(resumedQuestion.selfExplanation ?? "");
        setIsAnswerSubmitted(true);
        setShowFeedback(true);
      }
    } else {
      generateNextQuestion(existingSession);
    }
  }, [resumeSessionId, sessions, generateNextQuestion]);

  const addContext = () => {
    if (newContext.trim() && !contexts.includes(newContext.trim())) {
      setContexts([...contexts, newContext.trim()]);
      setNewContext("");
    }
  };

  const removeContext = (index: number) => {
    setContexts(contexts.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    if (newInstruction.trim() && !instructions.includes(newInstruction.trim())) {
      setInstructions([...instructions, newInstruction.trim()]);
      setNewInstruction("");
    }
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const submitAnswer = async () => {
    if (!currentSession || !currentQuestion || isAnswered(currentQuestion) || (!userAnswer && selectedOption === null)) return;

    try {
      setIsEvaluating(true);
      setIsAnswerSubmitted(true);
      setError(null);

      const finalAnswer = currentQuestion.type === "multipleChoice" ? selectedOption ?? userAnswer : userAnswer;
      let isCorrect = false;
      let feedback = "";
      let answerScore: number | undefined;

      if (currentQuestion.type === "multipleChoice") {
        isCorrect = finalAnswer === currentQuestion.correctAnswer;
        feedback = isCorrect ? t.correctFeedback : t.incorrectFeedback;
      } else {
        const evaluation = await aiService.evaluateAnswer(
          {
            question: currentQuestion.question,
            userAnswer: finalAnswer?.toString() || "",
            correctAnswer: currentQuestion.correctAnswerText,
            evaluationCriteria: currentQuestion.evaluationCriteria,
            type: "dissertative",
            language,
          },
          {
            provider: multiProviderSettings.currentProvider,
            apiKey: currentProviderSettings.apiKey,
            model: currentProviderSettings.model,
            baseUrl: currentProviderSettings.baseUrl,
            customHeaders: currentProviderSettings.customHeaders,
          }
        );

        isCorrect = evaluation.isCorrect;
        feedback = evaluation.feedback;
        answerScore = evaluation.score;
      }

      const answeredAt = new Date();
      const settings = normalizeLearningSettings(currentSession.learningSettings);
      // A miss or a low-confidence answer on an original enters the review queue across sessions
      const updatedQuestion: Question = enterQueue(
        {
          ...currentQuestion,
          userAnswer: finalAnswer,
          isCorrect,
          feedback,
          score: answerScore,
          attempts: currentQuestion.attempts + 1,
          confidence,
        },
        answeredAt,
        settings.spacedRepetition
      );

      const updatedQuestions = [...currentSession.questions];
      updatedQuestions[currentSession.currentQuestionIndex!] = updatedQuestion;

      const score = sessionScore(updatedQuestions);

      const updatedSession: StudySession = {
        ...currentSession,
        questions: updatedQuestions,
        score,
        totalQuestions: updatedQuestions.length,
        difficulty: settings.desirableDifficulties ? nextDifficulty(updatedQuestions, currentSession.difficulty ?? "medium") : currentSession.difficulty,
      };

      // A review-session answer also moves the original question in its source session
      const reviewRef = currentQuestion.reviewOf && currentQuestion.sourceSessionId ? { sessionId: currentQuestion.sourceSessionId, questionId: currentQuestion.reviewOf } : undefined;

      setCurrentSession(updatedSession);
      setCurrentQuestion(updatedQuestion);
      setSessions((prev) => (reviewRef ? recordReviewResult(prev, reviewRef, isCorrect, confidence, answeredAt) : prev).map((s) => (s.id === currentSession.id ? updatedSession : s)));
      setShowFeedback(true);

      if (!isCorrect && settings.elaborativeInterrogation) {
        try {
          const elaborativeQ = await aiService.generateElaborativeQuestion(currentSession.contexts, currentQuestion.question, language as any, {
            provider: multiProviderSettings.currentProvider,
            apiKey: currentProviderSettings.apiKey,
            model: currentProviderSettings.model,
            baseUrl: currentProviderSettings.baseUrl,
            customHeaders: currentProviderSettings.customHeaders,
          });
          setElaborativeQuestion(elaborativeQ);
        } catch (error) {
          debugLog("Error generating elaborative question:", error);
        }
      }
    } catch (error) {
      debugLog("Error evaluating answer:", error);
      setError(getAIErrorMessage(error, t));
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextQuestion = () => {
    if (!currentSession || !currentQuestion) return;

    // Keep the follow-up prompt and the learner's answers with the question they belong to
    const explanation = selfExplanation.trim() || currentQuestion.selfExplanation;
    const savedQuestion: Question = {
      ...currentQuestion,
      elaborativeQuestion: elaborativeQuestion || currentQuestion.elaborativeQuestion,
      elaborativeAnswer: elaborativeAnswer.trim() || currentQuestion.elaborativeAnswer,
      selfExplanation: explanation,
      // Feedback belongs to the text it reviewed; an edited explanation drops it
      selfExplanationFeedback: explanation === currentQuestion.selfExplanation ? currentQuestion.selfExplanationFeedback : undefined,
    };
    const questions = currentSession.questions.map((q) => (q.id === savedQuestion.id ? savedQuestion : q));
    const updatedSession: StudySession = { ...currentSession, questions };

    setCurrentSession(updatedSession);
    setSessions((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));
    generateNextQuestion(updatedSession);
  };

  const requestExplanationFeedback = async () => {
    const explanation = selfExplanation.trim();
    if (!currentSession || !currentQuestion || !explanation) return;

    const correctAnswer = currentQuestion.type === "multipleChoice" ? currentQuestion.options?.[currentQuestion.correctAnswer ?? -1] : currentQuestion.correctAnswerText;

    try {
      setIsGettingFeedback(true);
      setExplanationFeedbackError(null);

      const explanationFeedback = await aiService.evaluateExplanation(
        { question: currentQuestion.question, correctAnswer: correctAnswer ?? "", explanation, language },
        {
          provider: multiProviderSettings.currentProvider,
          apiKey: currentProviderSettings.apiKey,
          model: currentProviderSettings.model,
          baseUrl: currentProviderSettings.baseUrl,
          customHeaders: currentProviderSettings.customHeaders,
        }
      );

      // Save the explanation with its feedback at once, so leaving the page keeps both
      const savedQuestion: Question = { ...currentQuestion, selfExplanation: explanation, selfExplanationFeedback: explanationFeedback };
      const updatedSession: StudySession = {
        ...currentSession,
        questions: currentSession.questions.map((q) => (q.id === savedQuestion.id ? savedQuestion : q)),
      };

      setCurrentQuestion(savedQuestion);
      setCurrentSession(updatedSession);
      setSessions((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));
    } catch (error) {
      debugLog("Error getting explanation feedback:", error);
      setExplanationFeedbackError(getAIErrorMessage(error, t));
    } finally {
      setIsGettingFeedback(false);
    }
  };

  const endSession = () => {
    if (!currentSession) return;

    const finalSession: StudySession = {
      ...currentSession,
      status: "completed",
    };

    setSessions((prev) => prev.map((s) => (s.id === currentSession.id ? finalSession : s)));
    navigate("/history");
  };

  // Keyboard: 1-4 / A-D pick an option, Enter submits and then moves on. Text fields keep their keys.
  const keyHandlerRef = useRef<(event: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandlerRef.current = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
      if (isSetupMode || reviewComplete || !currentSession || !currentQuestion) return;

      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const onOption = !!target?.closest("[data-option]");

      if (event.key === "Enter") {
        // Other focused controls (End session, Next question, confidence) activate natively
        if (event.shiftKey || (!onOption && target?.closest("button, a, summary, [role='button']"))) return;
        if (!showFeedback) {
          if (isEvaluating || isAnswered(currentQuestion) || (!userAnswer && selectedOption === null)) return;
          event.preventDefault();
          submitAnswer();
        } else {
          if (isGenerating || isGettingFeedback || isEvaluating) return;
          event.preventDefault();
          nextQuestion();
        }
        return;
      }

      if (currentQuestion.type !== "multipleChoice" || isAnswerSubmitted || showFeedback) return;
      const digit = ["1", "2", "3", "4"].indexOf(event.key);
      const index = digit >= 0 ? digit : ["a", "b", "c", "d"].indexOf(event.key.toLowerCase());
      if (index >= 0 && index < (currentQuestion.options?.length ?? 0)) {
        event.preventDefault();
        setSelectedOption(index);
      }
    };
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandlerRef.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const techniqueRows: { key: keyof LearningSettings; label: string; desc: string }[] = [
    { key: "spacedRepetition", label: t.spacedRepetition, desc: t.spacedRepetitionDesc },
    { key: "interleaving", label: t.interleaving, desc: t.interleavingDesc },
    { key: "elaborativeInterrogation", label: t.elaborativeInterrogation, desc: t.elaborativeInterrogationDesc },
    { key: "selfExplanation", label: t.selfExplanation, desc: t.selfExplanationDesc },
    { key: "desirableDifficulties", label: t.desirableDifficulties, desc: t.desirableDifficultiesDesc },
  ];

  const questionTypeLabels: Record<"multipleChoice" | "dissertative" | "mixed", string> = {
    multipleChoice: t.multipleChoice,
    dissertative: t.dissertative,
    mixed: t.mixed,
  };

  if (isSetupMode) {
    const questionTypeOptions = [
      { value: "multipleChoice" as const, desc: t.quickAssessment },
      { value: "dissertative" as const, desc: t.deepAnalysis },
      { value: "mixed" as const, desc: t.interleavedPractice },
    ];
    const techniquesOn = techniqueRows.filter(({ key }) => learningSettings[key]).length;
    const canStart = contexts.length > 0 && isProviderConfigured && !isGenerating;

    return (
      <div className="page grid gap-12 pb-36 lg:grid-cols-[minmax(0,1fr)_18rem] lg:pb-16">
        <div className="min-w-0">
          <h1 className="page-title">{t.startNewStudySession}</h1>

          <div className="mt-8 space-y-8">
            {/* Topics */}
            <div>
              <label htmlFor="topic-input" className="label">
                {t.studyContexts}
              </label>
              <div className="flex gap-2">
                <input
                  id="topic-input"
                  type="text"
                  value={newContext}
                  onChange={(e) => setNewContext(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addContext();
                    }
                  }}
                  placeholder={t.studyContextPlaceholder}
                  aria-describedby="topic-hint"
                  className="field min-w-0 flex-1"
                />
                <button type="button" onClick={addContext} disabled={!newContext.trim()} className="btn btn-secondary">
                  {t.add}
                </button>
              </div>
              <p id="topic-hint" className="hint">
                {t.studyContextsHelp}
              </p>
              {contexts.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-3">
                  {contexts.map((context, index) => (
                    <li key={context} className="tag max-w-full whitespace-normal py-1 pl-2 pr-0 text-sm text-ink">
                      <span className="min-w-0 break-words">{context}</span>
                      <button type="button" onClick={() => removeContext(index)} aria-label={formatMessage(t.studyRemoveItem, { item: context })} className="-my-2 inline-flex h-10 w-9 shrink-0 items-center justify-center text-ink-muted hover:text-ink">
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Instructions */}
            <div>
              <label htmlFor="instruction-input" className="label">
                {t.specialInstructions} <span className="font-normal text-ink-muted">{t.studyOptional}</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="instruction-input"
                  type="text"
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInstruction();
                    }
                  }}
                  placeholder={t.studyInstructionPlaceholder}
                  aria-describedby="instruction-hint"
                  className="field min-w-0 flex-1"
                />
                <button type="button" onClick={addInstruction} disabled={!newInstruction.trim()} className="btn btn-secondary">
                  {t.add}
                </button>
              </div>
              <p id="instruction-hint" className="hint">
                {t.specialInstructionsHelp}
              </p>
              {instructions.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-3">
                  {instructions.map((instruction, index) => (
                    <li key={instruction} className="tag max-w-full whitespace-normal py-1 pl-2 pr-0 text-sm text-ink">
                      <span className="min-w-0 break-words">{instruction}</span>
                      <button type="button" onClick={() => removeInstruction(index)} aria-label={formatMessage(t.studyRemoveItem, { item: instruction })} className="-my-2 inline-flex h-10 w-9 shrink-0 items-center justify-center text-ink-muted hover:text-ink">
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Question type */}
            <div>
              <p id="question-type-label" className="label">
                {t.questionType}
              </p>
              <div role="radiogroup" aria-labelledby="question-type-label" className="choice-group">
                {questionTypeOptions.map((option) => (
                  <label key={option.value} className="choice">
                    <input type="radio" name="question-type" value={option.value} checked={questionType === option.value} onChange={() => setQuestionType(option.value)} className="mt-1 h-4 w-4 shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-medium text-ink">{questionTypeLabels[option.value]}</span>
                      <span className="block text-sm text-ink-soft">{option.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <p id="difficulty-label" className="label">
                {t.difficulty}
              </p>
              <div role="radiogroup" aria-labelledby="difficulty-label" className="segmented">
                {DIFFICULTIES.map((level) => (
                  <button key={level} type="button" role="radio" aria-checked={difficulty === level} onClick={() => setDifficulty(level)} className="min-w-20">
                    {levelLabels[level]}
                  </button>
                ))}
              </div>
            </div>

            {/* Learning techniques */}
            <div>
              <p id="techniques-label" className="label">
                {t.learningTechniques}
              </p>
              <div role="group" aria-labelledby="techniques-label" className="choice-group">
                {techniqueRows.map(({ key, label, desc }) => (
                  <label key={key} className="choice bg-surface">
                    <input
                      type="checkbox"
                      checked={learningSettings[key]}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setLearningSettings((prev) => ({ ...prev, [key]: checked }));
                      }}
                      className="mt-1 h-4 w-4 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-ink">{label}</span>
                      <span className="block text-sm text-ink-soft">{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Session summary and the start action */}
        <aside className="min-w-0 lg:sticky lg:top-[calc(3.5rem+1.5rem)] lg:self-start">
          <h2 className="section-title">{t.studySessionSummaryTitle}</h2>
          <dl className="facts mt-3">
            <dt>{t.aiProvider}</dt>
            <dd className="min-w-0">
              <span className="break-words">
                {currentProviderConfig.name} · {currentProviderSettings.model}
              </span>{" "}
              <Link to="/settings" className="font-normal text-ink-soft underline hover:text-ink">
                {t.studyChange}
              </Link>
            </dd>
            <dt>{t.studyContexts}</dt>
            <dd>{contexts.length}</dd>
            <dt>{t.questionType}</dt>
            <dd>{questionTypeLabels[questionType]}</dd>
            <dt>{t.difficulty}</dt>
            <dd>{levelLabels[difficulty]}</dd>
            <dt>{t.studyTechniquesOn}</dt>
            <dd>
              {techniquesOn} / {techniqueRows.length}
            </dd>
          </dl>

          {error && (
            <div className="notice notice-error mt-6" role="alert">
              <AlertCircle aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}

          {/* Phones: the start action stays pinned to the bottom edge while the form scrolls */}
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ground px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0">
            <button type="button" onClick={startNewSession} disabled={!canStart} className="btn btn-primary w-full">
              {isGenerating ? t.generatingQuestion : t.startEnhancedSession}
            </button>
            {isGenerating && <div className="loading-rule mt-3" role="status" aria-label={t.generatingQuestion} />}
            {!isGenerating && contexts.length === 0 && <p className="hint">{t.aiErrorMissingContext}</p>}
            {!isGenerating && contexts.length > 0 && !isProviderConfigured && (
              <p className="hint">
                {formatMessage(t.studyProviderNeedsKey, { provider: currentProviderConfig.name })}{" "}
                <Link to="/settings" className="text-ink underline">
                  {t.studyOpenSettings}
                </Link>
              </p>
            )}
          </div>
        </aside>
      </div>
    );
  }

  // A review session whose queue is empty: show the result instead of a new question
  if (currentSession && reviewComplete) {
    const answered = answeredCount(currentSession.questions);
    const correct = currentSession.questions.filter((q) => q.isCorrect === true).length;
    return (
      <div className="page [&>*]:max-w-3xl">
        <h1 className="page-title">{t.reviewCompleteTitle}</h1>
        <p className="page-lede">{t.reviewCompleteDesc}</p>
        <dl className="facts mt-6 max-w-sm">
          <dt>{t.studyAnsweredLabel}</dt>
          <dd>{answered}</dd>
          <dt>{t.correct}</dt>
          <dd>{correct}</dd>
          <dt>{t.score}</dt>
          <dd>{sessionScore(currentSession.questions)}%</dd>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={endSession} className="btn btn-primary">
            {t.endSession}
          </button>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="page" role="status" aria-label={t.generatingQuestion}>
        <div className="loading-rule max-w-measure" />
      </div>
    );
  }

  // Study session: progress rule, session strip, question column and session facts
  const answeredQuestions = currentSession.questions.filter(isAnswered);
  const answered = answeredQuestions.length;
  const correct = answeredQuestions.filter((q) => q.isCorrect).length;
  const isReview = currentSession.kind === "review";
  const queueLeft = currentSession.reviewQueue?.length ?? 0;
  const ruleStates = currentSession.questions.map((q) => (isAnswered(q) ? (q.isCorrect ? "correct" : "wrong") : q.id === currentQuestion?.id ? "current" : "pending"));
  // Normal sessions are open-ended, so the rule grows in blocks of ten
  const slots = isReview ? ruleStates.length + queueLeft : Math.max(10, Math.ceil(ruleStates.length / 10) * 10);
  const ruleSlots = [...ruleStates, ...Array<string>(Math.max(0, slots - ruleStates.length)).fill("pending")];
  const questionNumber = currentQuestion ? (currentSession.currentQuestionIndex ?? 0) + 1 : currentSession.questions.length + 1;
  const questionLabel = isReview ? formatMessage(t.studyQuestionNumberOf, { number: questionNumber, total: slots }) : formatMessage(t.studyQuestionNumber, { number: questionNumber });
  const shownDifficulty = currentQuestion?.difficulty ?? currentSession.difficulty ?? "medium";
  const focusContext = sessionSettings.interleaving ? currentQuestion?.context : undefined;
  const lastConfidence = [...answeredQuestions].reverse().find((q) => q.confidence !== undefined)?.confidence;

  const strip = (
    <>
      <div className="progress-rule" role="img" aria-label={formatMessage(t.studyProgressSummary, { answered, correct })}>
        {ruleSlots.map((state, index) => (
          <span key={index} data-state={state} />
        ))}
      </div>
      <div className="border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm text-ink-soft sm:px-6 lg:px-10">
          <p className="min-w-0 max-w-full truncate sm:max-w-[28rem] lg:max-w-[36rem]" title={currentSession.contexts.join(" · ")}>
            {currentSession.contexts.map((context, index) => (
              <Fragment key={context}>
                {index > 0 && " · "}
                <span className={focusContext === undefined ? "text-ink" : context === focusContext ? "font-medium text-ink" : undefined}>{context}</span>
              </Fragment>
            ))}
          </p>
          <span className="tabular">{questionLabel}</span>
          <span>
            {t.score}{" "}
            <span className="tabular font-medium text-ink">
              {correct} / {answered}
            </span>
          </span>
          <span className="tag">{levelLabels[shownDifficulty]}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="mr-2 hidden text-ink-muted lg:inline" title={t.aiProvider}>
              {currentProviderConfig.name} · {currentProviderSettings.model}
            </span>
            <button type="button" onClick={toggleFullscreen} aria-pressed={isFullscreen} aria-label={isFullscreen ? t.studyExitFullscreen : t.studyEnterFullscreen} title={isFullscreen ? t.studyExitFullscreen : t.studyEnterFullscreen} className="btn btn-ghost btn-icon hidden sm:inline-flex">
              {isFullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
            </button>
            <button type="button" onClick={endSession} className="btn btn-secondary btn-sm">
              {t.endSession}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const sessionFacts = (
    <aside className="min-w-0 lg:sticky lg:top-[calc(3.5rem+1.5rem)] lg:self-start">
      <h2 className="section-title">{t.studyThisSession}</h2>
      <dl className="facts mt-3">
        <dt>{t.studyAnsweredLabel}</dt>
        <dd>{answered}</dd>
        <dt>{t.correct}</dt>
        <dd>{correct}</dd>
        <dt>{t.score}</dt>
        <dd>{sessionScore(currentSession.questions)}%</dd>
        <dt>{t.difficulty}</dt>
        <dd>{levelLabels[currentSession.difficulty ?? "medium"]}</dd>
        <dt>{t.confidence}</dt>
        <dd>{lastConfidence !== undefined ? `${lastConfidence} / 5` : "–"}</dd>
        {isReview && (
          <>
            <dt>{t.studyLeftInQueue}</dt>
            <dd>{queueLeft}</dd>
          </>
        )}
      </dl>
      <div className="hidden lg:block">
        <h2 className="section-title mt-8">{t.learningTechniques}</h2>
        <dl className="facts mt-3">
          {techniqueRows.map(({ key, label }) => (
            <Fragment key={key}>
              <dt>{label}</dt>
              <dd>{sessionSettings[key] ? t.studySettingOn : t.studySettingOff}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </aside>
  );

  const frameClass = isFullscreen ? "fixed inset-0 z-50 overflow-y-auto bg-ground" : undefined;

  if (!currentQuestion) {
    // No question yet: the first generation is running, or it failed and needs a way out
    return (
      <div ref={questionContainerRef} className={frameClass}>
        {strip}
        <div className="page">
          <h1 className="sr-only">{questionLabel}</h1>
          {error && !isGenerating ? (
            <div className="max-w-measure">
              <div className="notice notice-error" role="alert">
                <AlertCircle aria-hidden="true" />
                <p>{error}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => generateNextQuestion(currentSession)} className="btn btn-primary">
                  {t.tryAgain}
                </button>
                <button type="button" onClick={endSession} className="btn btn-secondary">
                  {t.endSession}
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-measure" role="status">
              <div className="loading-rule" />
              <p className="mt-2 text-sm text-ink-soft">{t.generatingQuestion}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isMultipleChoice = currentQuestion.type === "multipleChoice";
  const graded = showFeedback && isAnswered(currentQuestion);
  const pickedOption = typeof currentQuestion.userAnswer === "number" ? currentQuestion.userAnswer : selectedOption;
  const correctLetter = currentQuestion.correctAnswer !== undefined ? OPTION_KEYS[currentQuestion.correctAnswer] : undefined;
  const showSelfExplanation = showFeedback && sessionSettings.selfExplanation && (currentQuestion.isCorrect || !sessionSettings.elaborativeInterrogation);
  const explanationFeedback = currentQuestion.selfExplanationFeedback && selfExplanation.trim() === currentQuestion.selfExplanation ? currentQuestion.selfExplanationFeedback : undefined;

  const waitingLabel = isGenerating ? t.generatingQuestion : isEvaluating ? (showFeedback ? t.studyWritingFollowUp : t.evaluating) : null;
  const primaryAction = showFeedback
    ? { label: error ? t.tryAgain : t.nextQuestion, onClick: nextQuestion, disabled: isGenerating || isGettingFeedback || isEvaluating }
    : { label: error ? t.tryAgain : t.submitAnswer, onClick: submitAnswer, disabled: isEvaluating || (!userAnswer && selectedOption === null) };

  return (
    <div ref={questionContainerRef} className={frameClass}>
      {strip}
      <div className="page grid gap-12 lg:grid-cols-[minmax(0,68ch)_17rem] lg:justify-between">
        <div className="min-w-0">
          {/* Writing the next question: the old one gives way to the loading line */}
          {isGenerating && (
            <div className="max-w-measure" role="status">
              <div className="loading-rule" />
              <p className="mt-2 text-sm text-ink-soft">{t.generatingQuestion}</p>
            </div>
          )}
          <div hidden={isGenerating}>
            <h1 className="sr-only">{questionLabel}</h1>
            <div className="text-xl font-normal leading-snug text-ink sm:text-2xl [&_p:last-child]:mb-0 [&_p]:leading-snug">
              <MarkdownRenderer content={currentQuestion.question} />
            </div>

            {/* Answer */}
            {isMultipleChoice ? (
              <div role="group" aria-label={t.studyAnswerOptions} className="mt-8">
                {currentQuestion.options?.map((option, index) => {
                  const isCorrectOption = index === currentQuestion.correctAnswer;
                  const isPicked = index === pickedOption;
                  const state = graded ? (isCorrectOption ? "correct" : isPicked ? "wrong" : "muted") : selectedOption === index ? "selected" : undefined;
                  return (
                    <button
                      key={index}
                      type="button"
                      data-option=""
                      data-state={state}
                      aria-pressed={graded ? undefined : selectedOption === index}
                      disabled={isAnswerSubmitted || showFeedback}
                      onClick={() => setSelectedOption(index)}
                      className="option disabled:cursor-default"
                    >
                      <span className="option-key">{OPTION_KEYS[index]}</span>
                      <span className="min-w-0 break-words [&_p:last-child]:mb-0 [&_p]:mb-2">
                        <MarkdownRenderer content={option} />
                      </span>
                      <span className="option-note">
                        {graded && isCorrectOption && (
                          <>
                            <Check aria-hidden="true" />
                            {isPicked ? t.studyYourAnswerCorrectNote : t.studyCorrectAnswerNote}
                          </>
                        )}
                        {graded && isPicked && !isCorrectOption && (
                          <>
                            <X aria-hidden="true" />
                            {t.studyYourAnswerNote}
                          </>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8">
                <label htmlFor="dissertative-answer" className="label">
                  {t.studyYourAnswerNote}
                </label>
                <textarea id="dissertative-answer" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder={t.dissertativeAnswerPlaceholder} rows={8} readOnly={isEvaluating || showFeedback} className="field" />
              </div>
            )}

            {/* Confidence, before grading */}
            {!showFeedback && (
              <div className="mt-8">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p id="confidence-label" className="label mb-0">
                    {t.confidenceQuestion}
                  </p>
                  <p className="tabular text-sm text-ink-soft">{formatMessage(t.studyConfidenceValue, { value: confidence })}</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-sm text-ink-muted">{t.notConfident}</span>
                  <div role="group" aria-labelledby="confidence-label" className="segmented">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button key={level} type="button" aria-pressed={confidence === level} onClick={() => setConfidence(level)} disabled={isEvaluating} className="tabular min-w-10 px-0">
                        {level}
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-ink-muted">{t.veryConfident}</span>
                </div>
              </div>
            )}

            {/* Feedback */}
            {showFeedback && isMultipleChoice && currentQuestion.explanation && (
              <div className="block mt-8">
                <h2 className="block-title">{t.studyExplanationTitle}</h2>
                <div className="block-body [&_p:last-child]:mb-0">
                  <MarkdownRenderer content={stripExplanationLabel(currentQuestion.explanation)} />
                </div>
              </div>
            )}
            {showFeedback && !isMultipleChoice && currentQuestion.feedback && (
              <div className={`block mt-8 ${(currentQuestion.score ?? (currentQuestion.isCorrect ? 100 : 0)) >= 70 ? "block-success" : "block-error"}`}>
                <h2 className="block-title">{currentQuestion.score !== undefined ? formatMessage(t.studyFeedbackScoreTitle, { score: currentQuestion.score }) : t.studyFeedbackTitle}</h2>
                <div className="block-body [&_p:last-child]:mb-0">
                  <MarkdownRenderer content={currentQuestion.feedback} />
                </div>
              </div>
            )}

            {/* Elaborative interrogation after a wrong answer */}
            {showFeedback && elaborativeQuestion && !currentQuestion.isCorrect && (
              <div className="mt-8">
                <div className="block">
                  <h2 className="block-title">{t.elaborativePrompt}</h2>
                  <div className="block-body [&_p:last-child]:mb-0">
                    <MarkdownRenderer content={elaborativeQuestion} />
                  </div>
                </div>
                <label htmlFor="elaborative-answer" className="label mt-4">
                  {t.studyElaborativeAnswerLabel}
                </label>
                <textarea id="elaborative-answer" value={elaborativeAnswer} onChange={(e) => setElaborativeAnswer(e.target.value)} placeholder={t.explainReasoning} rows={3} className="field" />
              </div>
            )}

            {/* Self-explanation: shown when no elaborative question applies */}
            {showSelfExplanation && (
              <div className="mt-8">
                <label htmlFor="self-explanation" className="label">
                  {isMultipleChoice && correctLetter ? formatMessage(t.studySelfExplanationPromptOption, { letter: correctLetter }) : t.selfExplanationPrompt}
                </label>
                <textarea id="self-explanation" value={selfExplanation} onChange={(e) => setSelfExplanation(e.target.value)} placeholder={t.selfExplanationPlaceholder} rows={3} className="field" />
                <div className="mt-3">
                  <button type="button" onClick={requestExplanationFeedback} disabled={isGettingFeedback || !selfExplanation.trim()} className="btn btn-secondary">
                    {t.getFeedback}
                  </button>
                </div>
                {isGettingFeedback && (
                  <div className="mt-4" role="status">
                    <div className="loading-rule" />
                    <p className="mt-2 text-sm text-ink-soft">{t.gettingFeedback}</p>
                  </div>
                )}
                {/* Shown while the text is the one the feedback reviewed */}
                {explanationFeedback && (
                  <div className="block mt-4">
                    <h2 className="block-title">{t.explanationFeedbackTitle}</h2>
                    <div className="block-body [&_p:last-child]:mb-0">
                      <MarkdownRenderer content={explanationFeedback} />
                    </div>
                  </div>
                )}
                {explanationFeedbackError && (
                  <div className="notice notice-error mt-4" role="alert">
                    <AlertCircle aria-hidden="true" />
                    <p>{explanationFeedbackError}</p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="notice notice-error mt-8" role="alert">
                <AlertCircle aria-hidden="true" />
                <p>{error}</p>
              </div>
            )}

            {waitingLabel && !isGenerating && (
              <div className="mt-8" role="status">
                <div className="loading-rule" />
                <p className="mt-2 text-sm text-ink-soft">{waitingLabel}</p>
              </div>
            )}

            {/* Primary action: sticky at the bottom on phones */}
            <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex items-center gap-3 border-t border-line bg-ground px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:p-0">
              <button type="button" onClick={primaryAction.onClick} disabled={primaryAction.disabled} className="btn btn-primary w-full sm:w-auto">
                {primaryAction.label}
              </button>
              <kbd className="hidden font-mono text-xs text-ink-muted lg:inline">{t.studyEnterKey}</kbd>
            </div>
          </div>
        </div>

        {sessionFacts}
      </div>
    </div>
  );
}
