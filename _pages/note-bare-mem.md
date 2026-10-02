---
permalink: /notes/bare-mem/
title: "BaRe-Mem: Bayesian Reliability Memory for Robust and Adaptive Agent Consultation"
excerpt: "When advisors can be wrong, a central model needs to know whom to trust and whether to consult at all."
author_profile: true
---

<style>
  .note-kicker { font-size: .78em; letter-spacing: .08em; text-transform: uppercase; color: #8a8984; margin: 0 0 .4em; }
  .note-title { font-size: 1.9em; line-height: 1.2; margin: 0 0 .45em; border-bottom: 0 !important; padding-bottom: 0 !important; }
  .note-dek { font-size: 1.12em; color: #4a4a46; margin: 0 0 .9em; }
  .note-meta { font-size: .9em; color: #6a6a65; margin: 0 0 1em; }
  .note-links a { display: inline-block; margin: 0 .35em .4em 0; padding: .2em .8em; border: 1px solid #d9d7d1; border-radius: 999px; font-size: .88em; text-decoration: none; }
  .note-fig { margin: 1.4em 0 1.6em; }
  .note-fig img { display: block; width: 100%; height: auto; border: 1px solid #e7e5e0; border-radius: 8px; }
  .note-fig.narrow img { max-width: 80%; margin: 0 auto; }
  .note-fig figcaption { font-size: .86em; color: #6a6a65; margin-top: .5em; line-height: 1.5; }
  .note-table { font-size: .9em; }
</style>

<p class="note-kicker">Note</p>

<h1 class="note-title">BaRe-Mem: Bayesian Reliability Memory for Robust and Adaptive Agent Consultation</h1>

<p class="note-dek">When advisors can be wrong, a central model needs to know two things: whom to trust, and whether to consult at all. BaRe-Mem learns both from verified outcomes.</p>

<p class="note-meta"><b>Peilin Feng</b> · October 2, 2026 · 8 min read · Multi-Agent Consultation</p>

<p class="note-links"><a href="https://arxiv.org/abs/2609.35551">Paper</a><a href="https://github.com/declare-lab/BaRe-Mem">GitHub</a><a href="https://huggingface.co/spaces/Sssunset/BaRe-Mem">Project page</a><a href="https://huggingface.co/datasets/Sssunset/BaRe-Mem-Data">Dataset</a></p>

<figure class="note-fig">
  <a href="/images/notes/bare-mem/fig1_memory_update.png"><img src="/images/notes/bare-mem/fig1_memory_update.png" alt="Reliability of two candidates before and after three verified answers"></a>
  <figcaption>Two candidates start with the same reliability. After candidate 1 is verified right, right and then wrong, its estimate moves to the red and then the blue posterior; candidate 2, never checked, stays where it was. The gains are the Kalman gains of each update.</figcaption>
</figure>

Look at panel (b) above. Before any evidence, both candidates sit at a reliability of one half. Candidate 1 then gives two answers that turn out to be right, and its estimate rises to 0.68. A third answer turns out to be wrong, and it falls back to 0.58. Candidate 2 was never checked, so nothing about it changes.

That small picture is the whole mechanism. Reliability is something you can keep track of, one verified answer at a time, and how far each answer moves the estimate depends on how uncertain the estimate still is: the three steps above have gains of 0.36, 0.26 and 0.21.

In this note, I want to focus on a question that this kind of bookkeeping raises but cannot answer on its own: once a model knows which advisor to trust most, how does it know whether it should be listening to its advisors at all?

## Why does consultation need a memory?

More and more AI systems are built as groups of agents: a central model that can consult other models, tools or people before it answers. Consultation helps when the advisors know something the central model does not. It hurts when they do not, and it can hurt a lot. A fluent, confident, wrong answer can pull a model away from an answer it had right, and several advisors agreeing does not make them correct if they all fall for the same plausible mistake.

Advisors are also uneven. A model that is reliable on arithmetic may be poor at reading comprehension. So the useful question is never "is this advisor good?" but "is this advisor good on questions like this one?"

A history of past interactions contains that information. The difficulty is turning it into something that can act on the current decision. Keeping transcripts or summaries preserves the history, but it does not tell the central model how much weight to give each answer it is reading right now.

## What BaRe-Mem keeps track of

BaRe-Mem stores reliability as the posterior of a Bayesian linear regression. For each question, the frozen central model reads the question together with every candidate answer, and its hidden states give two kinds of features: what the question looks like, and what each answer says. Every candidate gets a score made of three parts: how reliable its source has been on similar questions, what the content of its answer suggests, and a constant.

Each verified outcome updates this posterior exactly, with a rank-one Kalman update; nothing is recomputed from scratch. The estimate for a question is always read before that question's outcome is written, so it only ever uses earlier evidence.

One detail matters for the rest of this note. The candidates include not only the advisors but also the central model's own answer, produced without consultation. That answer is never shown to the model as advice. It is there so that the memory also learns how good the central model is on its own: an estimate I will call κ.

## Whom to trust: reweight attention, not the prompt

The first use of the estimates is to change how much each advisor's answer influences the central model. Inside every attention head, the scores on an advisor's tokens are shifted by γ times the log of that advisor's reliability relative to the most reliable one. The most trusted advisor is left untouched; the others are progressively downweighted. There are no new parameters, no training, and no extra text in the prompt.

We call this variant Advisors + memory. It helps: it is clearly more robust than giving the model the question and all advisor answers with no memory (Question + Peers). But it has a blind spot. Relative weights can tell the model whom to trust more. They cannot tell it that the whole pool has become worth ignoring.

## When should the model stop listening?

This is where the second use comes in. With T the highest advisor reliability on the current question, BaRe-Mem estimates the accuracy of consulting as

<p style="text-align:center; font-size:1.08em"><i>A</i>(<i>T</i>) = <i>T</i>·<i>ρ</i> + (1 − <i>T</i>)(<i>κ</i> − <i>δ</i>),</p>

and consults only if A(T) ≥ κ. Here ρ is how well the model does when trustworthy evidence is present, and δ is how much unreliable evidence costs it relative to answering alone. Both are learned online from verified questions, with the same Bayesian regression as the memory.

The rule has a useful reading: when ρ > κ and δ > 0, the model consults once T exceeds a threshold δ / (ρ + δ − κ). That threshold rises with κ. The better the model already is on a question, the more trustworthy the advice must look before it is worth hearing.

## What happens when the advisors are wrong on purpose?

To test this, we evaluate six central models with six advisors on nine benchmarks in two regimes. In the capability-supported regime (GSM8K, SQuAD, APPS), most central models are strong and good advice is easy to find. In the capability-challenging regime (PIQA, MMLU, OpenBookQA, SciQ, BBH, SuperGLUE), abilities vary much more across models and tasks. We then replace a growing share of advisor answers with misleading ones: fluent, on topic and well formed, but verified to be wrong.

<figure class="note-fig narrow">
  <a href="/images/notes/bare-mem/fig2_misleading_accuracy.png"><img src="/images/notes/bare-mem/fig2_misleading_accuracy.png" alt="Accuracy against the misleading information ratio for Qwen3-14B and Phi-4"></a>
  <figcaption>Accuracy as the misleading information ratio grows, for Qwen3-14B (top) and Phi-4 (bottom). Left: capability-supported regime; right: capability-challenging regime.</figcaption>
</figure>

In the capability-supported regime, consulting holds up well; only majority votes collapse. The interesting column is the capability-challenging one, at the two ends of the sweep:

<div class="note-table" markdown="1">

| Capability-challenging | No consultation | Question + Peers (0% → 100%) | BaRe-Mem (0% → 100%) | Consults (0% → 100%) |
| --- | ---: | ---: | ---: | ---: |
| Qwen3-14B | 66.5 | 69.8 → 50.6 | 76.1 → 68.6 | 90% → 21% |
| Phi-4 | 63.4 | 65.8 → 48.3 | 71.2 → 65.0 | 85% → 18% |

</div>

Question + Peers and two rounds of debate are below answering alone by the time half the advice is misleading. Majority votes collapse faster still. Advisors + memory lasts longer, but it too ends below the No consultation line. BaRe-Mem stays above that line at every ratio we tested, and the last column shows why: it consults on fewer and fewer questions. In the capability-supported regime, where advice stays useful, its consultation ratio barely moves (87% to 85% for Qwen3-14B).

This is a narrower claim than "BaRe-Mem detects misleading answers". It does not label individual answers. What it learns, from verified outcomes, is that consulting this pool on this kind of question has stopped paying off.

## Does the memory know its own model?

The decision leans on κ, so it is worth checking that κ means something.

<figure class="note-fig">
  <a href="/images/notes/bare-mem/fig3_kappa.png"><img src="/images/notes/bare-mem/fig3_kappa.png" alt="Estimated autonomous ability against empirical accuracy"></a>
  <figcaption>Left: mean κ and the model's accuracy without consultation along the question stream. Right: accuracy without consultation for groups of questions with similar κ; the dashed diagonal is perfect calibration.</figcaption>
</figure>

Along the stream, κ moves with the model's actual accuracy. Grouping questions by κ, accuracy rises monotonically with it. κ is not a calibrated probability, as the curve is steeper than the diagonal, but higher κ reliably means a question the model is more likely to get right by itself.

We also compared the predicted gain of consulting, A(T) − κ, with the real gain after verification. The real gain rises with the predicted one at every misleading ratio, and the curves cross zero close to where the prediction does. The boundary the memory draws between "consult" and "answer alone" is roughly where it should be.

## How much verification does it need?

Verified outcomes are not free. We varied the share of questions whose outcome is written to memory, on the capability-challenging stream.

<figure class="note-fig">
  <a href="/images/notes/bare-mem/fig5_sparse_feedback.png"><img src="/images/notes/bare-mem/fig5_sparse_feedback.png" alt="BaRe-Mem accuracy against the share of questions with verified feedback"></a>
  <figcaption>BaRe-Mem accuracy as the share of verified questions grows from 0% to 100%. Insets magnify the region below 1%.</figcaption>
</figure>

With no feedback at all, Qwen3-14B with BaRe-Mem answers 67.3% correctly. With 1% of the questions verified, about 170 of them, it reaches 73.3%; with 10%, 75.7%; with everything, 76.1%. Phi-4 follows the same shape, from 65.0% to 68.1% at 1% and 70.6% at 10%. Most of the gain arrives long before full verification.

## From answers to workers

The same memory can serve a different decision. In an agent team on MuSiQue (2,417 tasks, 6,404 sub-tasks), a lead agent splits each task into sub-tasks, gives each one to a worker, checks the report, and tries another worker if the report is rejected. Here BaRe-Mem does not reweight answers. It ranks the workers before any of them has replied.

<figure class="note-fig">
  <a href="/images/notes/bare-mem/agent_team_loop.png"><img src="/images/notes/bare-mem/agent_team_loop.png" alt="Agent team pipeline with BaRe-Mem"></a>
  <figcaption>The lead reads the memory to rank candidate workers; every verified report is written back.</figcaption>
</figure>

<figure class="note-fig">
  <a href="/images/notes/bare-mem/fig6_agent_team.png"><img src="/images/notes/bare-mem/fig6_agent_team.png" alt="Agent-team task completion on MuSiQue"></a>
  <figcaption>Tasks solved with Qwen3-14B and Phi-4 as the lead, without a check, with the lead's own check, and with the dataset's exact check.</figcaption>
</figure>

With Qwen3-14B leading, BaRe-Mem solves 38.9%, 41.4% and 54.3% of tasks under the three verification settings, against 35.5%, 39.5% and 50.4% when routing by historical success counts. With Phi-4 leading, the numbers are 40.0%, 42.6% and 54.2% against 31.8%, 37.0% and 50.5%. When the lead may keep trying workers until one succeeds, every strategy approaches the same ceiling, but BaRe-Mem solves more tasks with fewer calls: it finds a capable worker earlier.

## What I would check before trusting an advisor pool

If a model is consulting other agents, I would first ask whether the pool is worth consulting on this task at all, not only which advisor ranks highest. A ranking always has a winner, even when every option is bad.

Second, I would keep the central model's own answer in the record. Without an estimate of what the model can do alone, there is nothing to compare the advice against.

Third, I would verify a small sample rather than nothing. In our runs, verifying 1% of the questions, about 170, already recovered a large part of the gain.

There are limits. BaRe-Mem needs verified outcomes, even if sparse. It reads the central model's hidden states and edits its attention, so it needs an open-weight central model. And our misleading advisors were constructed: wrong, but in a controlled way. Advice in the wild can fail in less tidy ways. What the experiments do show is that "whom to trust" and "whether to listen" are separate questions, and that one memory, updated from verified outcomes, can answer both.

## Citation

```bibtex
@misc{feng2026baremembayesianreliabilitymemory,
      title={BaRe-Mem: Bayesian Reliability Memory for Robust and Adaptive Agent Consultation},
      author={Peilin Feng and Zhengyang Huang and Soujanya Poria},
      year={2026},
      eprint={2609.35551},
      archivePrefix={arXiv},
      primaryClass={cs.AI},
      url={https://arxiv.org/abs/2609.35551},
}
```
