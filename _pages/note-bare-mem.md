---
layout: note
permalink: /notes/bare-mem/
title: "Mathematical Intuition Behind BaRe-Mem"
excerpt: "The mathematics behind our Bayesian reliability memory"
image: /images/notes/bare-mem/fig1_memory_update.png
math: true
widgets: /assets/js/notes/bare-mem.js
author_profile: false
---

<p class="note-kicker">Note · BaRe-Mem</p>

<h1 class="note-title">Mathematical Intuition Behind BaRe-Mem</h1>

<p class="note-dek">The mathematics behind our Bayesian reliability memory.</p>

<p class="note-meta"><b>Peilin Feng</b> · October 2, 2026 · 15 min read · Multi-Agent Consultation</p>

<p class="note-links"><a href="https://arxiv.org/abs/2609.35551">Paper</a><a href="https://github.com/declare-lab/BaRe-Mem">GitHub</a><a href="https://huggingface.co/spaces/Sssunset/BaRe-Mem">Project page</a><a href="https://huggingface.co/datasets/Sssunset/BaRe-Mem-Data">Dataset</a></p>

Our [BaRe-Mem paper](https://arxiv.org/abs/2609.35551) and [Project Page](https://huggingface.co/spaces/Sssunset/BaRe-Mem) describe the pipeline and the experiment results. This note is about something a paper can only state in passing: why the mathematics works. Everything BaRe-Mem does (trusting one advisor over another, steering attention, deciding whether to consult at all) comes out of a single Bayesian linear regression and a few lines of algebra. I will build it up one piece at a time. 

Here is what we want. For every candidate answer $$k$$ to a question $$q_t$$, a number $$p_{t,k}$$: the probability that this answer is right. That number should

- start neutral, before anything has been verified;
- update **exactly** after each verified outcome, without retraining anything;
- know **how uncertain** it is;
- be usable for two decisions: how much to listen to each advisor, and whether to listen at all.

## Part 1: Reliability as a regression problem

In the paper: [Section 3.1, *Belief Representation*](https://arxiv.org/html/2609.35551v1#S3.SS1.SSS0.Px1).
{: .part-ref}

### The candidates

For question $$q_t$$, the central model $$M$$ can read $$K$$ advisor answers. BaRe-Mem adds one more candidate: $$M$$'s own autonomous answer $$a_{t,0}$$, produced without consultation. That answer is never shown to $$M$$ as advice. It is there so that the memory also learns how good $$M$$ is on its own, which we will need in Part 5.

### Representing a candidate

The frozen central model reads the question together with candidate $$k$$, and its hidden states give two kinds of belief: a **question belief** $$\psi_q(t)$$, shared by all candidates of the question, and an **answer content belief** $$\psi_c(t,k)$$, specific to the candidate. BaRe-Mem stacks them into one vector:

$$
x_{t,k} = \big[\, e_k \otimes \psi_q(t) \;;\; \psi_c(t,k) \;;\; 1 \,\big]
$$

Here $$e_k$$ is the one-hot identity of the candidate's source. The Kronecker product $$e_k \otimes \psi_q(t)$$ is a long vector with one block per source; the question features go into the block of source $$k$$ and every other block is zero. Pick a candidate below and watch which block lights up.

<div class="widget narrow" id="w-anatomy">
  <p class="w-title">Figure 1 · Anatomy of a candidate</p>
  <p class="w-sub">The same question features land in a different block for each source, so each source is scored by its own weights.</p>
</div>

Multiply by a weight vector $$w$$ laid out the same way, and the score splits into three readable parts:

$$
w^\top x_{t,k} \;=\; \underbrace{w_k^\top \psi_q(t)}_{\text{source reliability}} \;+\; \underbrace{w_c^\top \psi_c(t,k)}_{\text{answer content reliability}} \;+\; \underbrace{w_0}_{\text{bias}}
$$

The block structure is what makes reliability **contextual**. Advisor 3 does not get one global trust score; it gets its own linear function $$w_3^\top \psi_q(t)$$ of what the question looks like. Two advisors can therefore be ranked one way on arithmetic and the other way on reading comprehension, from the same features. The content part, by contrast, is shared across sources: if a certain kind of answer tends to be wrong, that lesson applies to every advisor who gives one. In the released code, each $$\psi$$ is a 256-dimensional PCA projection of $$M$$'s hidden states.

### The target: signed correctness

Once an answer is verified we know $$y_{t,k} \in \{0,1\}$$. BaRe-Mem regresses on the signed version $$s_{t,k} = 2y_{t,k} - 1 \in \{-1,+1\}$$ with a Gaussian likelihood and a Gaussian prior:

$$
s_{t,k} \mid x_{t,k}, w \;\sim\; \mathcal N\!\big(w^\top x_{t,k},\, 1\big), \qquad w \;\sim\; \mathcal N\!\big(0,\, \lambda^{-1} I\big)
$$

A Gaussian on a $$\pm 1$$ label looks puzzling at first: it is a regression on a classification target. What it buys is a posterior in closed form and updates that are exact. Part 3 turns the Gaussian back into a probability. The prior precision $$\lambda$$ says how much evidence it takes to move the memory; the experiments use $$\lambda = 100$$.

## Part 2: The posterior, exactly and online

In the paper: [Section 3.1, *Memory*](https://arxiv.org/html/2609.35551v1#S3.SS1.SSS0.Px2); derivations in [Appendix A.1–A.4](https://arxiv.org/html/2609.35551v1#A1.SS1).
{: .part-ref}

### The batch posterior

Given every verified candidate so far, the posterior over $$w$$ is Gaussian with precision $$\Lambda$$ and mean $$m$$:

$$
\Lambda = \lambda I + \sum x\,x^\top, \qquad b = \sum s\,x, \qquad m = \Lambda^{-1} b
$$

[Appendix A.1](https://arxiv.org/html/2609.35551v1#A1.SS1) of the paper derives this by completing the square in the log posterior. Two readings are worth keeping in mind. $$\Lambda$$ is a **precision**: every verified candidate adds $$x\,x^\top$$, so certainty accumulates exactly in the directions where evidence was observed. And $$m$$ is a **ridge regression**: it is the unique minimiser of $$\sum (s - w^\top x)^2 + \lambda \lVert w \rVert^2$$, with the prior acting as the regulariser.

### Process one outcome at a time

Recomputing $$\Lambda^{-1}$$ after every question would be wasteful. Adding one observation changes $$\Lambda$$ by a rank-one term, and the Sherman–Morrison identity inverts a rank-one change in closed form ([Appendix A.3](https://arxiv.org/html/2609.35551v1#A1.SS3) proves it and derives the update):

$$
\big(P + u\,u^\top\big)^{-1} \;=\; S \;-\; \frac{S\,u\,u^\top S}{1 + u^\top S\,u}, \qquad S = P^{-1}
$$

Setting $$u = x_{t,k}$$ and $$S = \Lambda^{-1}$$ gives the whole update in three lines:

<div class="box" markdown="1">

$$
\begin{aligned}
g &= \frac{\Lambda^{-1} x}{1 + x^\top \Lambda^{-1} x} \\
m &\leftarrow m + g\,\big(s - x^\top m\big) \\
\Lambda^{-1} &\leftarrow \Lambda^{-1} - g\,\big(\Lambda^{-1} x\big)^\top
\end{aligned}
$$

</div>

The vector $$g$$ is the **Kalman gain** (derived in [Appendix A.2](https://arxiv.org/html/2609.35551v1#A1.SS2)), and it is the heart of the method. Everything the memory learns passes through it, so it deserves a closer look.

### Comprehend the Kalman gain

The gain is easiest to understand through what it does to the candidate's own score. Write $$\mu = x^\top m$$ for the current estimate and $$v = x^\top \Lambda^{-1} x$$ for its uncertainty, and multiply the mean update by $$x^\top$$:

$$
\mu' \;=\; \mu + \underbrace{x^\top g}_{K}\,\big(s - \mu\big), \qquad
K \;=\; x^\top g \;=\; \frac{v}{1 + v}.
$$

Rearranged, this is a **weighted average** of what the memory believed and what it has just seen:

$$
\mu' \;=\; (1 - K)\,\mu \;+\; K\,s .
$$

The gain $$K \in [0, 1)$$ is the weight on the new evidence, and it is not a tuning knob. It is the uncertainty of the belief divided by the total uncertainty, belief plus the unit noise of one outcome:

$$
K \;=\; \frac{v}{v + 1} \;=\; \frac{\text{uncertainty of the belief}}{\text{uncertainty of the belief} + \text{noise of one outcome}} .
$$

When the memory knows nothing about a candidate ($$v$$ large), $$K \to 1$$ and the new outcome is taken almost at face value. When it already knows a lot ($$v \to 0$$), $$K \to 0$$ and one more outcome barely moves it. The update also shrinks the uncertainty, by exactly the same factor:

$$
v' \;=\; (1 - K)\,v \;=\; \frac{v}{1 + v}, \qquad \frac{1}{v'} \;=\; \frac{1}{v} + 1 .
$$

Every verified outcome adds exactly one unit of precision, so the next gain is always smaller than the last. Press the buttons below and watch both happen: the update lands $$K$$ of the way from the belief to the outcome, and $$K$$ shrinks with every observation.

<div class="widget" id="w-gain">
  <p class="w-title">Figure 2 · The Kalman gain as a mixing weight</p>
  <p class="w-sub">Left: the belief about a candidate's score (black), the outcome just observed (green or red, with unit noise) and the dashed belief before the update. Right: the expected squared error of that update for every step size k; the Kalman gain sits at the minimum, below any fixed step.</p>
</div>

### Why this gain, and not another step

The right panel is the derivation of [Appendix A.2](https://arxiv.org/html/2609.35551v1#A1.SS2) drawn out. For any update $$m + k\,(s - x^\top m)$$, the expected squared error after the update is

$$
R(k) = \operatorname{tr} S - 2\,k^\top S x + (1 + v)\,k^\top k, \qquad v = x^\top S x .
$$

It is a quadratic in $$k$$, and setting its gradient to zero gives exactly $$k = S x / (1 + v) = g$$. In one dimension $$R(k) = v - 2kv + (1 + v)\,k^2$$ is a parabola whose minimum sits at $$k = K$$, where the error equals the new uncertainty $$v'$$. Any fixed step size is worse, except by luck at one particular moment.

### The gain is a vector

In more than one dimension, $$g = S x / (1 + v)$$ points along $$S x$$, not along $$x$$. Through the posterior covariance $$S$$, a single outcome moves every weight that the memory believes is correlated with $$x$$. That is how evidence about one candidate can reach another through what they share: the content belief $$\psi_c$$ and the bias. With the shared bias switched on in Figure 3, you can watch it happen.

### Watching it work

The paper's [Figure 1](https://arxiv.org/html/2609.35551v1#S3.F1) is the simplest case. Give each candidate a single feature of its own, $$x = e_k$$. Then every quantity is a scalar, and after $$n$$ verified outcomes $$s_1, \dots, s_n$$ of that candidate:

$$
\mu_n = \frac{\sum_{i \le n} s_i}{\lambda + n}, \qquad v_n = \frac{1}{\lambda + n} .
$$

With $$\lambda = 16/9$$, the first three gains are $$0.36$$, $$0.26$$ and $$0.21$$, exactly the numbers annotated in the paper's figure. Press "Paper's Figure 1" to replay it, or verify answers yourself.

<div class="widget" id="w-memory">
  <p class="w-title">Figure 3 · The memory, one verified answer at a time</p>
  <p class="w-sub">Each curve is the predictive distribution of a candidate's signed correctness; the shaded area right of zero is its reliability p. The dashed curve is the state before the last update.</p>
</div>

Two things to try. First, verify only candidate 1: candidate 2 does not move, because no evidence touched its direction. Then switch on the shared bias feature and do it again. Now both candidates contain a common component, the covariance couples them, and evidence about one leaks into the other.

### A step size that adapts

In the scalar case the gain of the $$n$$-th update is

$$
K_n = \frac{v_{n-1}}{1 + v_{n-1}} = \frac{1}{\lambda + n} ,
$$

so the memory is a **running average** of $$\pm 1$$ outcomes that starts with $$\lambda$$ phantom observations of zero. That is what a good step size should do: take large steps while little is known and ever smaller ones as evidence piles up. A fixed step cannot do both. Small, and it is slow to learn; large, and it never settles, because each new outcome keeps pushing it around.

<div class="widget" id="w-step">
  <p class="w-title">Figure 4 · An adaptive step against fixed steps</p>
  <p class="w-sub">Verified outcomes of one candidate stream in (right with probability p*). Top: the estimate under the Kalman gain and under two fixed step sizes, against the target 2p* − 1. Bottom: the step size each rule uses.</p>
</div>

The figure is a toy, but the pattern is general. Averaged over 2,000 random streams with $$p^* = 0.7$$, the error over the first 300 outcomes is $$0.075$$ with the Kalman gain, against $$0.110$$ with the fixed step $$0.02$$ and $$0.318$$ with $$0.3$$. A single stream can come out either way, so press "New random stream" a few times.

### Two properties for free

Because $$\Lambda$$ and $$b$$ are plain sums, the posterior does not depend on the order in which verified outcomes arrive: any permutation gives the same $$\Lambda$$, the same $$b$$ and therefore the same $$m$$ ([Appendix A.4](https://arxiv.org/html/2609.35551v1#A1.SS4)). And because $$p_{t,k}$$ is always read before the outcome of question $$t$$ is written, every estimate uses only earlier evidence; there is no leakage from the answer being scored.

## Part 3: From a score to a probability

In the paper: [Section 3.1, *Reliability Estimate*](https://arxiv.org/html/2609.35551v1#S3.SS1.SSS0.Px3); derivation in [Appendix A.5](https://arxiv.org/html/2609.35551v1#A1.SS5).
{: .part-ref}

The posterior over $$w$$ is Gaussian, so the score of a candidate is Gaussian too:

$$
w^\top x \mid \mathcal D \;\sim\; \mathcal N(\mu, v), \qquad \mu = x^\top m, \qquad v = x^\top \Lambda^{-1} x
$$

Here $$\mu$$ is the expected signed correctness and $$v$$ is the memory's uncertainty about it. The observation adds its own unit noise, $$s = w^\top x + \varepsilon$$, so the prediction for the signed correctness is $$s \sim \mathcal N(\mu,\, 1 + v)$$. BaRe-Mem defines reliability as the probability that this prediction is positive:

$$
p_{t,k} \;=\; \Pr\big(s > 0\big) \;=\; \Phi\!\left( \frac{\mu_{t,k}}{\sqrt{1 + v_{t,k}}} \right)
$$

That is the shaded area in Figure 3. Two consequences follow directly. Before any evidence, $$m = 0$$, so every candidate starts at $$p = \Phi(0) = \tfrac12$$. And for a fixed $$\mu$$, a larger $$v$$ shrinks $$\mu/\sqrt{1+v}$$ toward zero, which pulls $$p$$ toward $$\tfrac12$$: an advisor the memory knows little about, or a question unlike any seen so far, is neither trusted nor distrusted strongly.

## Part 4: Reliability inside attention

In the paper: [Section 3.2](https://arxiv.org/html/2609.35551v1#S3.SS2).
{: .part-ref}

The first use of $$p_{t,k}$$ is to change how much each advisor's answer influences the central model. For a context token $$j$$ that belongs to the response of advisor $$c(j)$$, BaRe-Mem adds a bias to the attention logit in every attention head:

$$
\alpha_{qj} = \operatorname{softmax}_j\!\left( \frac{\langle Q_q, K_j\rangle}{\sqrt d} + \beta_{t,c(j)} \right), \qquad
\beta_{t,k} = \gamma \log \frac{p_{t,k}}{\max_{k'} p_{t,k'}}
$$

with $$\beta = 0$$ for every token outside an advisor response. Write $$c_k = e^{\beta_{t,k}} = \big(p_{t,k} / \max_{k'} p_{t,k'}\big)^{\gamma}$$. Since $$\exp$$ of a sum is a product, the softmax becomes

$$
\alpha_{qj} = \frac{c_{c(j)}\; e^{\ell_{qj}}}{\sum_i c_{c(i)}\; e^{\ell_{qi}}}, \qquad \ell_{qj} = \frac{\langle Q_q, K_j\rangle}{\sqrt d},
$$

with $$c = 1$$ for tokens outside advisor responses. So the bias is an exact **multiplicative reweighting**: the total attention mass $$M_k$$ on advisor $$k$$'s answer becomes $$c_k M_k / Z$$, with $$Z$$ renormalising over the whole context.

A few properties fall straight out of the formula. Every $$c_k \in (0, 1]$$, and the most reliable advisor has $$c = 1$$: its weight is never changed. Its *share* of the attention can still grow, because the other advisors shrink before the mass is renormalised. The weights depend only on the ratios $$p_k / \max p$$, so multiplying every reliability by the same constant changes nothing. $$\gamma = 0$$ switches the mechanism off, and as $$\gamma$$ grows, attention concentrates on the top advisor. There are no trainable parameters; in the experiments, $$\gamma = 3$$, applied in the full-attention layers.

## Part 5: Deciding whether to consult

In the paper: [Section 3.3](https://arxiv.org/html/2609.35551v1#S3.SS3); derivations in [Appendix A.6–A.8](https://arxiv.org/html/2609.35551v1#A1.SS6).
{: .part-ref}

Relative weights can say whom to trust more. They cannot say that the whole pool of advisors is worth ignoring. For that, BaRe-Mem compares two abilities on the current question.

### Two numbers from one memory

Both come out of the memory we already have. The own-answer candidate gives the central model's **autonomous ability**, and the best advisor gives the **trust** in the available evidence:

$$
\kappa_t = p_{t,0}, \qquad T_t = \max_{k \ge 1} p_{t,k}
$$

### A model of consultation

When trust is high ($$T \to 1$$), consultation succeeds with some probability $$\rho$$: how well $$M$$ uses trustworthy evidence. When trust is low ($$T \to 0$$), unreliable evidence can pull $$M$$ away from its own judgment, costing $$\delta$$ relative to answering alone. BaRe-Mem interpolates between the two:

$$
A(T) \;=\; \underbrace{T\,\rho}_{\text{reliable evidence}} \;+\; \underbrace{(1 - T)\,(\kappa - \delta)}_{\text{unreliable evidence}}
$$

### Learning ρ and δ is another Bayesian regression

$$\rho$$ and $$\delta$$ are unknown, but after each question we see $$y_t \in \{0, 1\}$$: whether consulting gave the right answer. Model it as $$y_t = A(T_t) + \varepsilon_t$$ and move the known term to the left:

$$
z_t \equiv y_t - (1 - T_t)\,\kappa_t = u_t^\top \theta + \varepsilon_t, \qquad
u_t = \begin{bmatrix} T_t \\ T_t - 1 \end{bmatrix}, \qquad
\theta = \begin{bmatrix} \rho \\ \delta \end{bmatrix}
$$

That is the same Bayesian linear regression as in Part 2, now in two dimensions. With prior $$\theta \sim \mathcal N(\theta_0, I)$$ (the code uses $$\theta_0 = (0.5, 0)$$ and keeps one such regression per task type):

$$
P_c = I + \sum_{s<t} u_s u_s^\top, \qquad q_c = \theta_0 + \sum_{s<t} u_s z_s, \qquad \begin{bmatrix} \hat\rho \\ \hat\delta \end{bmatrix} = P_c^{-1} q_c
$$

The regressor $$u_t$$ tells you which parameter a question teaches. A question with $$T = 1$$ has $$u = [1, 0]$$ and $$z = y$$: it informs only $$\rho$$. A question with $$T = 0$$ has $$u = [0, -1]$$ and $$z = y - \kappa$$: it informs only $$\delta$$, the shortfall of consulting relative to answering alone. Everything in between informs both.

<div class="widget" id="w-learn">
  <p class="w-title">Figure 5 · Learning ρ and δ from verified questions</p>
  <p class="w-sub">Questions arrive with random trust T and autonomous ability κ; consulting succeeds with probability A(T). The estimates start at the prior (0.5, 0) and converge to the true values. The figure opens after 150 questions; press Reset to watch from the start.</p>
</div>

### The decision and its break-even trust

The central model consults when the estimated consultation ability beats answering alone, $$A(T_t) \ge \kappa_t$$. The difference is linear in $$T$$:

$$
G(T) = A(T) - \kappa = (\hat\rho + \hat\delta - \kappa)\,T - \hat\delta
$$

In the main regime, $$\hat\delta > 0$$ and $$\hat\rho > \kappa$$, $$G$$ rises from $$-\hat\delta$$ to $$\hat\rho - \kappa$$ and crosses zero once, at the **break-even trust**

$$
T^* = \frac{\hat\delta}{\hat\rho + \hat\delta - \kappa}.
$$

Writing $$D = \hat\rho + \hat\delta - \kappa$$, its derivatives are

$$
\frac{\partial T^*}{\partial \kappa} = \frac{\hat\delta}{D^2} > 0, \quad
\frac{\partial T^*}{\partial \hat\delta} = \frac{\hat\rho - \kappa}{D^2} > 0, \quad
\frac{\partial T^*}{\partial \hat\rho} = -\frac{\hat\delta}{D^2} < 0.
$$

Read the signs: the better the model already is, or the more bad advice costs, the more trustworthy the advice must look before it is worth hearing. Since $$G$$ is linear, its endpoints $$G(0) = -\hat\delta$$ and $$G(1) = \hat\rho - \kappa$$ decide everything, which gives four regimes: consult iff $$T \ge T^*$$ (the case above), never consult ($$\hat\delta \ge 0$$, $$\hat\rho < \kappa$$), always consult ($$\hat\delta \le 0$$, $$\hat\rho \ge \kappa$$), and consult iff $$T \le T^*$$ ($$\hat\delta < 0$$, $$\hat\rho < \kappa$$).

### What the decision actually needs

The appendix ends with a short argument ([Appendix A.8](https://arxiv.org/html/2609.35551v1#A1.SS8)) that changes how to think about all these estimates. Let $$a_t$$ and $$o_t$$ be the true probabilities that consulting and answering alone are right, and let $$W$$ be the questions where the rule picks the worse option. Then

$$
\mathrm{Acc}_{\mathrm{select}} \;\ge\; \max\big(\mathrm{Acc}_{\mathrm{consult}},\, \mathrm{Acc}_{\mathrm{alone}}\big) \;-\; \frac{1}{N} \sum_{t \in W} \lvert a_t - o_t \rvert .
$$

The decision only has to get the **sign** of $$A(T_t) - \kappa_t$$ right, not the values. When it gets the sign wrong, the cost is exactly the true gap $$\lvert a_t - o_t \rvert$$, so mistakes near a tie are almost free and only confident mistakes are expensive. What the estimates need is the right ordering between consulting and answering alone, not perfectly calibrated values.

## One regression, three uses

Put together, the whole method is a short chain of exact steps:

- a Bayesian linear regression on signed correctness, over features that give every source its own weights, updated in closed form with the Kalman gain;
- a probit read-out, $$p = \Phi\big(\mu / \sqrt{1 + v}\big)$$, that starts at one half and stays near it when the memory is unsure;
- a log-ratio attention bias, which is an exact multiplicative reweighting of each advisor's attention mass;
- a second, two-dimensional regression for $$\rho$$ and $$\delta$$, and a linear decision with a break-even trust $$T^*$$.

The same posterior serves one more decision in the paper: in an agent team, the lead ranks workers by $$p$$ computed from the sub-task alone, before any of them has answered. The pipeline and the experiments are in the [paper](https://arxiv.org/abs/2609.35551); the code is on [GitHub](https://github.com/declare-lab/BaRe-Mem).

## Citation

```bibtex
@article{feng2026bare,
  title={BaRe-Mem: Bayesian Reliability Memory for Robust and Adaptive Agent Consultation},
  author={Feng, Peilin and Huang, Zhengyang and Poria, Soujanya},
  journal={arXiv preprint arXiv:2609.35551},
  year={2026}
}
```
