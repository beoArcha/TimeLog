# USEREXPERIENCE.md

## User Experience Guide

This document defines the user experience (UX) principles for oXyFlow.
It protects the user's focus, flow, and sanity.

Architecture exists to serve the user, not the other way around.

---

## Core Philosophy

> **Less clicking. More flow.**

The application must get out of the user's way.
It is a productivity tool, not a destination.

---

## 1. Intuitive Discovery (The "It Should Be Here" Rule)

Placement of features must be strictly logical.
If a user intuitively assumes a button, setting, or command belongs in a specific place, it must be exactly there.

This applies equally to:

* Graphical User Interface (GUI)
* Command Line Interface (CLI)

No hunting for features. No nested mazes. No guessing.
The design must map perfectly to the user's mental model.

---

## 2. Zero Friction

Actions must require the absolute minimum number of interactions.

* Starting a timer requires one click.
* Stopping a timer requires one click.
* Creating a task must not interrupt the current timer.

Every additional click is a failure of design.

---

## 3. Predictability

The application must react the same way every single time.
Behavior must remain consistent across:

* Browser Runtime
* Desktop Runtime

A button that looks the same must act the same, regardless of the active `LayoutVariant`.

---

## 4. Performance is UX

Speed is a feature.

* Actions must feel instantaneous.
* UI must never stutter.
* Background synchronization or persistence must never block the UI thread.

Waiting for the interface to catch up is considered a critical UX bug.

---

## 5. Native-First Feel

When running as a desktop application, oXyFlow must behave like a first-class citizen of the operating system.

Required native behaviors:

* System-wide keyboard shortcuts
* System tray integration
* Native window controls
* Predictable focus management

---

## 6. Visual Stability

The interface must never jump, shift, or resize unexpectedly during normal use.

Thanks to the separation of `LayoutVariant` and `TextAndIconSize`, the application must remain perfectly readable and stable regardless of the user's chosen visual scale.

Components must gracefully handle long texts and missing data without breaking the layout.

---

## Definition of a UX Bug

Any of the following must be treated as a bug, equivalent to a system crash:

* The user has to click more than twice for a core action.
* The user cannot intuitively find a feature within 2 seconds.
* The UI freezes or drops frames.
* The application steals focus aggressively.
* A CLI command feels unnatural or contradicts GUI behavior.

---

## Guiding Principle

Design for the tired user.
If the interface requires active thinking to navigate, it needs to be redesigned.
